import type { IncomingMessage, ServerResponse } from 'http';
import { resolve as resolveUrl, parse as parseUrl } from 'url';
import type { CookieSerializeOptions } from 'cookie';
import { sign as signJwt, verify as verifyJWT } from 'jsonwebtoken';
import thenifiedly from 'thenifiedly';
import { getCookies, setCookie, isSubpath } from './utils';
import type {
  ResponseHelper,
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
  apiPath: string;
  redirectUrl: string;
  secret: string;
  authCookieAge: number;
  dataCookieAge: number;
  tokenAge: number;
  refreshPeriod: number;
  cookieDomain?: string;
  cookiePath: string;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
};

class CookieOperator {
  options: OperatorOptions;

  private _cookieScope: { domain?: string; path: string };

  private _tokenCookieOpts: CookieSerializeOptions;
  private _errorCookieOpts: CookieSerializeOptions;
  private _signatureCookieOpts: CookieSerializeOptions;
  private _stateCookieOpts: CookieSerializeOptions;
  private _deleteCookieOpts: CookieSerializeOptions;

  constructor(options: OperatorOptions) {
    const {
      apiPath,
      authCookieAge,
      dataCookieAge,
      cookieDomain,
      cookiePath,
      sameSite,
      secure,
    } = options;

    this.options = options;
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
      path: apiPath,
      sameSite,
      secure,
      httpOnly: true,
      maxAge: dataCookieAge,
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
      this.options.secret,
      { expiresIn: this.options.dataCookieAge }
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
    const { secret, tokenAge, refreshPeriod } = this.options;

    const now = Math.floor(Date.now() / 1000);

    const payload: AuthPayload<Data> = {
      platform,
      data,
      refreshTill: !refreshTill
        ? now + refreshPeriod
        : refreshTill > now + tokenAge
        ? refreshTill
        : undefined,
      scope: this._cookieScope,
    };

    const token = await thenifiedly.call(signJwt, payload, secret, {
      expiresIn: tokenAge,
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
    const redirectTarget = resolveUrl(this.options.redirectUrl, url || '');

    if (assertInternal) {
      const parsedBaseUrl = parseUrl(this.options.redirectUrl);
      const { protocol, host, pathname } = parseUrl(redirectTarget);

      if (
        (this.options.secure && protocol && protocol !== 'https:') ||
        host !== parsedBaseUrl.host ||
        !isSubpath(parsedBaseUrl.pathname, pathname)
      ) {
        res.writeHead(400);
        res.end('invalid redirect url');
        return false;
      }
    }

    res.writeHead(302, {
      Location: redirectTarget,
    });
    res.end();

    return true;
  }

  createResponseHelper(
    req: IncomingMessage,
    res: ServerResponse,
    platform: string
  ): ResponseHelper {
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
    };
  }
}

export default CookieOperator;
