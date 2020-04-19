// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import { sign as signJWT, verify as verifyJWT } from 'jsonwebtoken';
import thenifiedly from 'thenifiedly';
import type {
  AuthPayload,
  StatePayload,
  ErrorPayload,
  AuthTokenPayload,
  StateTokenPayload,
  ErrorTokenPayload,
} from '../types';
import { getCookies, setCookie } from './utils';

import {
  STATE_COOKIE_KEY,
  TOKEN_COOKIE_KEY,
  SIGNATURE_COOKIE_KEY,
  ERROR_COOKIE_KEY,
} from '../constant';

type OperatorOptions = {
  entryPath: string,
  secret: string,
  authCookieAge: number,
  dataCookieAge: number,
  tokenAge: number,
  refreshPeriod: number,
  cookieDomain: void | string,
  cookiePath: string,
  sameSite: 'Strict' | 'Lax' | 'None',
  secure: boolean,
};

type IssueAuthOptions = {
  refreshLimit?: number,
  refreshable?: boolean,
  signatureOnly?: boolean,
};

export class CookieOperator {
  options: OperatorOptions;

  _cookieScope: {| domain?: string, path: string |};

  _tokenCookieOpts: Object;
  _errorCookieOpts: Object;
  _signatureCookieOpts: Object;
  _stateCookieOpts: Object;
  _deleteCookieOpts: Object;

  constructor(options: OperatorOptions) {
    this.options = options;

    const {
      entryPath,
      authCookieAge,
      dataCookieAge,
      cookieDomain,
      cookiePath,
      sameSite,
      secure,
    } = options;

    this._cookieScope = { domain: cookieDomain, path: cookiePath };

    const baseCookieOpts = {
      domain: cookieDomain,
      path: cookiePath,
      sameSite,
      secure,
    };

    this._tokenCookieOpts = {
      ...baseCookieOpts,
      maxAge: authCookieAge,
    };

    this._errorCookieOpts = {
      ...baseCookieOpts,
      maxAge: dataCookieAge,
    };

    this._signatureCookieOpts = {
      ...baseCookieOpts,
      httpOnly: true,
    };

    this._stateCookieOpts = {
      path: entryPath,
      sameSite,
      secure,
      httpOnly: true,
      maxAge: dataCookieAge,
    };

    this._deleteCookieOpts = {
      domain: cookieDomain,
      path: cookiePath,
      expires: new Date(0),
    };
  }

  async getState<StateData>(
    req: IncomingMessage,
    platformAsserted: string
  ): Promise<null | StateData> {
    let stateEnceded;
    const cookies = getCookies(req);
    if (!cookies || !(stateEnceded = cookies[STATE_COOKIE_KEY])) {
      return null;
    }

    try {
      const {
        platform,
        state,
      }: StateTokenPayload<any> = await thenifiedly.call(
        verifyJWT,
        stateEnceded,
        this.options.secret
      );

      return platform === platformAsserted ? state : null;
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
      ({ platform, state }: StatePayload<StateData>),
      this.options.secret,
      { expiresIn: this.options.dataCookieAge }
    );

    setCookie(res, STATE_COOKIE_KEY, stateEnceded, this._stateCookieOpts);
    return stateEnceded;
  }

  async getAuth<AuthData>(
    req: IncomingMessage,
    platformAsserted: string
  ): Promise<null | AuthData> {
    const cookies = getCookies(req);
    if (!cookies) {
      return null;
    }

    const contentVal = cookies[TOKEN_COOKIE_KEY];
    const sigVal = cookies[SIGNATURE_COOKIE_KEY];
    if (!contentVal || !sigVal) {
      return null;
    }

    try {
      const { platform, data }: AuthTokenPayload<any> = await thenifiedly.call(
        verifyJWT,
        `${contentVal}.${sigVal}`,
        this.options.secret
      );

      return platform === platformAsserted ? data : null;
    } catch (e) {
      return null;
    }
  }

  async issueAuth<AuthData>(
    res: ServerResponse,
    platform: string,
    data: AuthData,
    {
      refreshLimit,
      refreshable = true,
      signatureOnly = false,
    }: IssueAuthOptions = {}
  ): Promise<string> {
    const { secret, tokenAge, refreshPeriod } = this.options;

    const now = Math.floor(Date.now() / 1000);
    const token = await thenifiedly.call(
      signJWT,
      ({
        platform,
        data,
        refreshLimit: !refreshable
          ? undefined
          : !refreshLimit
          ? now + refreshPeriod
          : refreshLimit > now + tokenAge
          ? refreshLimit
          : undefined,
        scope: this._cookieScope,
      }: AuthPayload<AuthData>),
      secret,
      { expiresIn: tokenAge }
    );

    const [header, payload, signature] = token.split('.');
    const tokenContent = `${header}.${payload}`;

    setCookie(res, SIGNATURE_COOKIE_KEY, signature, this._signatureCookieOpts);
    if (!signatureOnly) {
      setCookie(res, TOKEN_COOKIE_KEY, tokenContent, this._tokenCookieOpts);
    }

    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, ERROR_COOKIE_KEY);

    return tokenContent;
  }

  async getError(
    req: IncomingMessage,
    platformAsserted: string
  ): Promise<null | { code: number, reason: string }> {
    let errEncoded;
    const cookies = getCookies(req);
    if (!cookies || !(errEncoded = cookies[ERROR_COOKIE_KEY])) {
      return null;
    }

    try {
      const { platform, error }: ErrorTokenPayload = await thenifiedly.call(
        verifyJWT,
        errEncoded,
        this.options.secret
      );

      return platform === platformAsserted ? error : null;
    } catch (e) {
      return null;
    }
  }

  async issueError(
    res: ServerResponse,
    platform: string,
    code: number,
    reason: string
  ): Promise<string> {
    const errEncoded = await thenifiedly.call(
      signJWT,
      ({
        platform,
        error: { code, reason },
        scope: this._cookieScope,
      }: ErrorPayload),
      this.options.secret
    );

    setCookie(res, ERROR_COOKIE_KEY, errEncoded, this._errorCookieOpts);

    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, SIGNATURE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_COOKIE_KEY);

    return errEncoded;
  }

  clearCookies(res: ServerResponse) {
    this.deleteCookie(res, ERROR_COOKIE_KEY);
    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, SIGNATURE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_COOKIE_KEY);
  }

  deleteCookie(res: ServerResponse, key: string) {
    setCookie(res, key, '', this._deleteCookieOpts);
  }
}

export class CookieAccessor {
  _req: IncomingMessage;
  _res: ServerResponse;
  _platform: string;
  _operator: CookieOperator;

  constructor(
    req: IncomingMessage,
    res: ServerResponse,
    platform: string,
    operator: CookieOperator
  ) {
    this._req = req;
    this._res = res;
    this._platform = platform;
    this._operator = operator;
  }

  getState<StateData>() {
    return this._operator.getState<StateData>(this._req, this._platform);
  }

  issueState<StateData>(state: StateData) {
    return this._operator.issueState<StateData>(
      this._res,
      this._platform,
      state
    );
  }

  getAuth<AuthData>() {
    return this._operator.getAuth<AuthData>(this._req, this._platform);
  }

  issueAuth<AuthData>(auth: AuthData, options?: IssueAuthOptions) {
    return this._operator.issueAuth<AuthData>(
      this._res,
      this._platform,
      auth,
      options
    );
  }

  getError() {
    return this._operator.getError(this._req, this._platform);
  }

  issueError(code: number, message: string) {
    return this._operator.issueError(this._res, this._platform, code, message);
  }
}
