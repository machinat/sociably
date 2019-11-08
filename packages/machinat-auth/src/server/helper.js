// @flow
import { parse as parseURL } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';
import { aign as signJWT, verify as verifyJWT } from 'jsonwebtoken';
import thenifiedly from 'thenifiedly';
import {
  checkPathScope,
  checkDomainScope,
  getCookies,
  setCookie,
} from './utils';
import type {
  AuthPayload,
  StatePayload,
  ErrorPayload,
  AuthData,
  StateData,
  ErrorData,
} from '../types';

import {
  STATE_COOKIE_KEY,
  TOKEN_CONTENT_COOKIE_KEY,
  TOKEN_SIGNATURE_COOKIE_KEY,
  ERROR_COOKIE_KEY,
} from '../constant';

class AuthFlowHelper {
  _hostname: string;
  _secret: string;
  _tokenAge: number;
  _scope: { domain?: string, path: string };

  _dev: boolean;

  _dataCookieOpts: Object;
  _secretCookieOpts: Object;
  deleteCookieOpts: Object;

  constructor(
    hostname: string,
    secret: string,
    tokenAge: number,
    cookieAge: number,
    scopeDomain?: string,
    scopePath: string,
    sameSiteStrict: boolean,
    dev: boolean
  ) {
    this._hostname = hostname;
    this._secret = secret;
    this._tokenAge = tokenAge;
    this._scope = { domain: scopeDomain, path: scopePath };
    this._dev = dev;

    const baseCookieOpts = {
      domain: scopeDomain,
      path: scopePath,
      sameSite: sameSiteStrict ? 'Strict' : 'Lax',
      secure: !dev,
    };

    this._dataCookieOpts = {
      ...baseCookieOpts,
      maxAge: cookieAge,
    };

    this._secretCookieOpts = {
      ...baseCookieOpts,
      httpOnly: true,
    };

    this.deleteCookieOpts = {
      domain: scopeDomain,
      path: scopePath,
      expires: new Date(0),
    };
  }

  verifyAppURLScope(url: string): boolean {
    const { protocol, hostname, pathname } = parseURL(url);
    const { _dev: dev, _scope: scope } = this;

    if (
      !(
        protocol &&
        /^https?:$/.test(protocol) &&
        (dev || protocol[4] === 's') &&
        hostname
      )
    ) {
      return false;
    }

    if (
      !(scope.domain
        ? checkDomainScope(hostname, scope.domain)
        : hostname === this._hostname)
    ) {
      return false;
    }

    return checkPathScope((pathname: any), scope.path);
  }

  async getState(
    req: IncomingMessage,
    platform: string
  ): Promise<null | StateData<any>> {
    let stateEnceded;
    const cookies = getCookies(req);
    if (!cookies || !(stateEnceded = cookies[STATE_COOKIE_KEY])) {
      return null;
    }

    try {
      const payload: StatePayload<any> = await thenifiedly.call(
        verifyJWT,
        stateEnceded,
        this._secret
      );

      return payload.platform === platform ? payload.state : null;
    } catch (e) {
      return null;
    }
  }

  async issueState(
    res: ServerResponse,
    platform: string,
    state: StateData<any>
  ) {
    const stateEnceded = await thenifiedly.call(
      signJWT,
      { platform, state, scope: this._scope },
      this._secret,
      { expiresIn: 180 }
    );

    setCookie(res, STATE_COOKIE_KEY, stateEnceded, this._secretCookieOpts);
  }

  async getAuth(
    req: IncomingMessage,
    platform: string
  ): Promise<null | AuthData<any>> {
    const cookies = getCookies(req);
    if (!cookies) {
      return null;
    }

    const contentVal = cookies[TOKEN_CONTENT_COOKIE_KEY];
    const sigVal = cookies[TOKEN_SIGNATURE_COOKIE_KEY];
    if (!contentVal || !sigVal) {
      return null;
    }

    try {
      const payload: AuthPayload<any> = await thenifiedly.call(
        verifyJWT,
        `${contentVal}.${sigVal}`,
        this._secret
      );

      return payload.platform === platform ? payload.auth : null;
    } catch (e) {
      return null;
    }
  }

  async issueAuth(res: ServerResponse, platform: string, auth: AuthData<any>) {
    const authToken = await thenifiedly.call(
      signJWT,
      { platform, auth, scope: this._scope },
      this._secret,
      { expiresIn: this._tokenAge }
    );

    const [header, payload, signature] = authToken.split('.');

    this.setDataCookie(res, TOKEN_CONTENT_COOKIE_KEY, `${header}.${payload}`);
    this.setSecretCookie(res, TOKEN_SIGNATURE_COOKIE_KEY, signature);

    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, ERROR_COOKIE_KEY);
  }

  async getError(
    req: IncomingMessage,
    platform: string
  ): Promise<null | ErrorData> {
    let errEncoded;
    const cookies = getCookies(req);
    if (!cookies || !(errEncoded = cookies[ERROR_COOKIE_KEY])) {
      return null;
    }

    try {
      const payload: ErrorPayload = await thenifiedly.call(
        verifyJWT,
        errEncoded,
        this._secret
      );

      return payload.platform === platform ? payload.error : null;
    } catch (e) {
      return null;
    }
  }

  async issueError(res: ServerResponse, platform: string, error: ErrorData) {
    const errEncoded = await thenifiedly.call(
      signJWT,
      { platform, error, scope: this._scope },
      this._secret
    );

    this.setDataCookie(res, ERROR_COOKIE_KEY, errEncoded);

    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_SIGNATURE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_CONTENT_COOKIE_KEY);
  }

  clearCookies(res: ServerResponse) {
    this.deleteCookie(res, ERROR_COOKIE_KEY);
    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_SIGNATURE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_CONTENT_COOKIE_KEY);
  }

  setDataCookie(res: ServerResponse, key: string, value: string) {
    setCookie(res, key, value, this._dataCookieOpts);
  }

  setSecretCookie(res: ServerResponse, key: string, value: string) {
    setCookie(res, key, value, this._secretCookieOpts);
  }

  deleteCookie(res: ServerResponse, key: string) {
    setCookie(res, key, '', this.deleteCookieOpts);
  }
}

export default AuthFlowHelper;
