import type { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { join as joinPath } from 'path';
import type { CookieSerializeOptions } from 'cookie';
import { sign as signJwt, verify as verifyJWT } from 'jsonwebtoken';
import thenifiedly from 'thenifiedly';
import { getCookies, setCookie, isSubpath } from './utils';
import type {
  HttpAuthHelper,
  IssueAuthOptions,
  RedirectOptions,
  AuthPayload,
  StatePayload,
  ErrorPayload,
  AuthTokenPayload,
  StateTokenPayload,
  ErrorTokenPayload,
  ErrorMessage,
} from './types';

import {
  STATE_COOKIE_KEY,
  TOKEN_COOKIE_KEY,
  SIGNATURE_COOKIE_KEY,
  ERROR_COOKIE_KEY,
} from './constant';

type OperatorOptions = {
  apiUrl: URL;
  redirectUrl: URL;
  secret: string;
  tokenCookieMaxAge: number;
  dataCookieMaxAge: number;
  tokenLifetime: number;
  refreshDuration: number;
  cookieDomain?: string;
  cookiePath: string;
  cookieSameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
};

class HttpAuthOperator {
  options: OperatorOptions;

  private _cookieScope: { domain?: string; path: string };

  private _errorCookieOpts: CookieSerializeOptions;
  private _tokenCookieOpts: CookieSerializeOptions;
  private _signatureCookieOpts: CookieSerializeOptions;
  private _stateCookieOpts: CookieSerializeOptions;
  private _deleteCookieOpts: CookieSerializeOptions;

  constructor(options: OperatorOptions) {
    const {
      apiUrl,
      tokenCookieMaxAge,
      dataCookieMaxAge,
      cookieDomain,
      cookiePath,
      cookieSameSite,
      secure,
    } = options;

    this.options = options;
    this._cookieScope = { domain: cookieDomain, path: cookiePath };

    const baseCookieOpts = {
      domain: cookieDomain,
      path: cookiePath,
      sameSite: cookieSameSite,
      secure,
    };

    this._errorCookieOpts = {
      ...baseCookieOpts,
      maxAge: dataCookieMaxAge,
    };

    this._tokenCookieOpts = {
      ...baseCookieOpts,
      maxAge: tokenCookieMaxAge,
    };

    this._signatureCookieOpts = {
      ...baseCookieOpts,
      httpOnly: true,
    };

    this._stateCookieOpts = {
      ...baseCookieOpts,
      path: apiUrl.pathname,
      httpOnly: true,
      maxAge: dataCookieMaxAge,
    };

    this._deleteCookieOpts = {
      domain: cookieDomain,
      path: cookiePath,
      expires: new Date(0),
      sameSite: 'lax',
    };
  }

  async getState<State>(
    req: IncomingMessage,
    platformAsserted: string
  ): Promise<null | State> {
    let encodedState: string;
    const cookies = getCookies(req);
    if (!cookies || !(encodedState = cookies[STATE_COOKIE_KEY])) {
      return null;
    }

    try {
      const { platform, state }: StateTokenPayload<State> =
        await thenifiedly.call(verifyJWT, encodedState, this.options.secret);

      return platform === platformAsserted ? state : null;
    } catch (e) {
      return null;
    }
  }

  async issueState<State>(
    res: ServerResponse,
    platform: string,
    state: State
  ): Promise<string> {
    const encodedState = await thenifiedly.call(
      signJwt,
      { platform, state } as StatePayload<State>,
      this.options.secret
    );

    setCookie(res, STATE_COOKIE_KEY, encodedState, this._stateCookieOpts);
    return encodedState;
  }

  async getAuth<Data>(
    req: IncomingMessage,
    platformAsserted: string
  ): Promise<null | Data> {
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
      const { platform, data }: AuthTokenPayload<Data> = await thenifiedly.call(
        verifyJWT,
        `${contentVal}.${sigVal}`,
        this.options.secret
      );

      return platform === platformAsserted ? data : null;
    } catch (e) {
      return null;
    }
  }

  async issueAuth<Data>(
    res: ServerResponse,
    platform: string,
    data: Data,
    { refreshTill, signatureOnly = false }: IssueAuthOptions = {}
  ): Promise<string> {
    const { secret, tokenLifetime, refreshDuration } = this.options;

    const now = Math.floor(Date.now() / 1000);

    const payload: AuthPayload<Data> = {
      platform,
      data,
      refreshTill: !refreshTill
        ? now + refreshDuration
        : refreshTill > now + tokenLifetime
        ? refreshTill
        : undefined,
      scope: this._cookieScope,
    };

    const token = await thenifiedly.call(signJwt, payload, secret, {
      expiresIn: tokenLifetime,
    });

    const [header, body, signature] = token.split('.');
    const tokenContent = `${header}.${body}`;

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
  ): Promise<null | ErrorMessage> {
    let errEncoded: string;
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
      signJwt,
      {
        platform,
        error: { code, reason },
        scope: this._cookieScope,
      } as ErrorPayload,
      this.options.secret
    );

    setCookie(res, ERROR_COOKIE_KEY, errEncoded, this._errorCookieOpts);

    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, SIGNATURE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_COOKIE_KEY);

    return errEncoded;
  }

  clearCookies(res: ServerResponse): void {
    this.deleteCookie(res, ERROR_COOKIE_KEY);
    this.deleteCookie(res, STATE_COOKIE_KEY);
    this.deleteCookie(res, SIGNATURE_COOKIE_KEY);
    this.deleteCookie(res, TOKEN_COOKIE_KEY);
  }

  deleteCookie(res: ServerResponse, key: string): void {
    setCookie(res, key, '', this._deleteCookieOpts);
  }

  redirect(
    res: ServerResponse,
    url?: string,
    { assertInternal }: RedirectOptions = {}
  ): boolean {
    const redirectBase = this.options.redirectUrl;
    const redirectTarget = new URL(url || '', redirectBase);

    if (assertInternal) {
      const { protocol, host, pathname } = redirectTarget;

      if (
        (this.options.secure && protocol && protocol !== 'https:') ||
        host !== redirectBase.host ||
        !isSubpath(redirectBase.pathname, pathname)
      ) {
        res.writeHead(400);
        res.end('invalid redirect url');
        return false;
      }
    }

    res.writeHead(302, {
      Location: redirectTarget.href,
    });
    res.end();

    return true;
  }

  getApiEntry(platform: string, subpath?: string): string {
    return new URL(
      joinPath(this.options.apiUrl.pathname, platform, subpath || ''),
      this.options.apiUrl
    ).href;
  }

  createAuthHelper(
    req: IncomingMessage,
    res: ServerResponse,
    platform: string
  ): HttpAuthHelper {
    return {
      getState: <State>() => this.getState<State>(req, platform),
      issueState: <State>(state: State) =>
        this.issueState(res, platform, state),

      getAuth: () => this.getAuth(req, platform),
      issueAuth: <Data>(data: Data, options: IssueAuthOptions) =>
        this.issueAuth(res, platform, data, options),

      getError: () => this.getError(req, platform),
      issueError: (code: number, message: string) =>
        this.issueError(res, platform, code, message),

      redirect: (url?: string, options?: RedirectOptions) =>
        this.redirect(res, url, options),
      getApiEntry: (subpath?: string): string =>
        this.getApiEntry(platform, subpath),
    };
  }
}

export default HttpAuthOperator;
