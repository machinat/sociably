// @flow
import { parse as parseURL } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';
import { aign as signJWT, verify as verifyJWT } from 'jsonwebtoken';
import thenifiedly from 'thenifiedly';
import type {
  AuthPayload,
  StatePayload,
  ErrorPayload,
  AuthTokenPayload,
  StateTokenPayload,
  ErrorTokenPayload,
} from '../types';
import {
  checkPathScope,
  checkDomainScope,
  getCookies,
  setCookie,
} from './utils';

import {
  STATE_COOKIE_KEY,
  TOKEN_CONTENT_COOKIE_KEY,
  TOKEN_SIGNATURE_COOKIE_KEY,
  ERROR_COOKIE_KEY,
} from '../constant';

class AuthCookieSession {
  hostname: string;
  secret: string;
  tokenAge: number;
  refreshPeriod: number;
  scopeDomain: void | string;
  scopePath: string;
  dev: boolean;

  _scope: {| domain?: string, path: string |};

  _dataCookieOpts: Object;
  _secretCookieOpts: Object;
  deleteCookieOpts: Object;

  constructor(
    hostname: string,
    secret: string,
    cookieAge: number,
    tokenAge: number,
    refreshPeriod: number,
    scopeDomain: void | string,
    scopePath: string,
    sameSite: 'Strict' | 'Lax' | 'None',
    dev: boolean
  ) {
    this.hostname = hostname;
    this.secret = secret;
    this.tokenAge = tokenAge;
    this.refreshPeriod = refreshPeriod;
    this.scopeDomain = scopeDomain;
    this.scopePath = scopePath;
    this.dev = dev;

    this._scope = { domain: scopeDomain, path: scopePath };

    const baseCookieOpts = {
      domain: scopeDomain,
      path: scopePath,
      sameSite,
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

  checkURLAuthScope(url: string): boolean {
    const { protocol, hostname, pathname } = parseURL(url);
    const { dev, scopeDomain, scopePath } = this;

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
      !(scopeDomain
        ? checkDomainScope(hostname, scopeDomain)
        : hostname === this.hostname)
    ) {
      return false;
    }

    return checkPathScope((pathname: any), scopePath);
  }

  async getState<StateData>(
    req: IncomingMessage,
    platform: string
  ): Promise<null | StateData> {
    let stateEnceded;
    const cookies = getCookies(req);
    if (!cookies || !(stateEnceded = cookies[STATE_COOKIE_KEY])) {
      return null;
    }

    try {
      const payload: StateTokenPayload<any> = await thenifiedly.call(
        verifyJWT,
        stateEnceded,
        this.secret
      );

      return payload.platform === platform ? payload.state : null;
    } catch (e) {
      return null;
    }
  }

  async issueState<StateData>(
    res: ServerResponse,
    platform: string,
    state: StateData
  ): Promise<string> {
    const stateEnceded = await thenifiedly.call(
      signJWT,
      ({ platform, state, scope: this._scope }: StatePayload<StateData>),
      this.secret,
      { expiresIn: 180 }
    );

    setCookie(res, STATE_COOKIE_KEY, stateEnceded, this._secretCookieOpts);
    return stateEnceded;
  }

  async getAuth<AuthData>(
    req: IncomingMessage,
    platform: string
  ): Promise<null | AuthData> {
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
      const payload: AuthTokenPayload<any> = await thenifiedly.call(
        verifyJWT,
        `${contentVal}.${sigVal}`,
        this.secret
      );

      return payload.platform === platform ? payload.auth : null;
    } catch (e) {
      return null;
    }
  }

  async issueAuth<AuthData>(
    res: ServerResponse,
    platform: string,
    auth: AuthData,
    refreshBy?: number,
    refreshable: boolean = true,
    signatureOnly: boolean = false
  ): Promise<string> {
    const { secret, tokenAge } = this;

    const now = Math.floor(Date.now() / 1000);
    const token = await thenifiedly.call(
      signJWT,
      ({
        platform,
        auth,
        refreshLimit: !refreshable
          ? undefined
          : typeof refreshBy === 'number'
          ? refreshBy
          : now + this.refreshPeriod,
        scope: this._scope,
      }: AuthPayload<AuthData>),
      secret,
      { expiresIn: tokenAge }
    );

    const [header, payload, signature] = token.split('.');
    const tokenContent = `${header}.${payload}`;

    this.setSecretCookie(res, TOKEN_SIGNATURE_COOKIE_KEY, signature);
    if (!signatureOnly) {
      this.setDataCookie(res, TOKEN_CONTENT_COOKIE_KEY, tokenContent);
    }

    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, ERROR_COOKIE_KEY);

    return tokenContent;
  }

  async getError(
    req: IncomingMessage,
    platform: string
  ): Promise<null | { code: number, message: string }> {
    let errEncoded;
    const cookies = getCookies(req);
    if (!cookies || !(errEncoded = cookies[ERROR_COOKIE_KEY])) {
      return null;
    }

    try {
      const payload: ErrorTokenPayload = await thenifiedly.call(
        verifyJWT,
        errEncoded,
        this.secret
      );

      return payload.platform === platform ? payload.error : null;
    } catch (e) {
      return null;
    }
  }

  async issueError(
    res: ServerResponse,
    platform: string,
    code: number,
    message: string
  ): Promise<string> {
    const errEncoded = await thenifiedly.call(
      signJWT,
      ({
        platform,
        error: { code, message },
        scope: this._scope,
      }: ErrorPayload),
      this.secret
    );

    this.setDataCookie(res, ERROR_COOKIE_KEY, errEncoded);

    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_SIGNATURE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_CONTENT_COOKIE_KEY);

    return errEncoded;
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

export default AuthCookieSession;
