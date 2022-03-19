import { makeClassProvider } from '@machinat/core';
import type { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { join as joinPath } from 'path';
import invariant from 'invariant';
import type { CookieSerializeOptions } from 'cookie';
import {
  sign as signJwt,
  verify as verifyJWT,
  SignOptions,
} from 'jsonwebtoken';
import thenifiedly from 'thenifiedly';
import { ConfigsI } from './interface';
import { getCookies, setCookie, isSubpath, isSubdomain } from './utils';

import type {
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
  serverUrl: string;
  apiRoot?: string;
  redirectRoot?: string;
  secret: string;
  tokenCookieMaxAge?: number;
  dataCookieMaxAge?: number;
  tokenLifetime?: number;
  refreshDuration?: number;
  cookieDomain?: string;
  cookiePath?: string;
  cookieSameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
};

export class AuthHttpOperator {
  apiRootUrl: URL;
  redirectRootUrl: URL;
  secret: string;
  tokenLifetime: number;
  refreshDuration: number;
  secure: boolean;

  private _cookieScope: { domain?: string; path: string };
  private _errorCookieOpts: CookieSerializeOptions;
  private _tokenCookieOpts: CookieSerializeOptions;
  private _signatureCookieOpts: CookieSerializeOptions;
  private _stateCookieOpts: CookieSerializeOptions;
  private _deleteCookieOpts: CookieSerializeOptions;

  constructor(options: OperatorOptions) {
    const {
      serverUrl,
      apiRoot,
      redirectRoot,
      secret,
      tokenLifetime = 3600, // 1 hr
      refreshDuration = 864000, // 10 day
      dataCookieMaxAge = 180, // 3 min
      cookieDomain,
      cookiePath = '/',
      cookieSameSite = 'lax',
      secure = true,
    } = options;
    invariant(secret, 'options.secret must not be empty');
    invariant(serverUrl, 'options.serverUrl must not be empty');

    this.secret = secret;
    this.tokenLifetime = tokenLifetime;
    this.refreshDuration = refreshDuration;
    this.secure = secure;
    this._cookieScope = {
      domain: cookieDomain,
      path: cookiePath,
    };

    const apiUrl = new URL(apiRoot || '', serverUrl);
    invariant(
      !secure || apiUrl.protocol === 'https:',
      'protocol of options.serverUrl should be "https" when options.secure is set to true'
    );
    invariant(
      !cookieDomain || isSubdomain(cookieDomain, apiUrl.hostname),
      'options.serverUrl should be under a subdomain of options.cookieDomain'
    );
    invariant(
      isSubpath(cookiePath, apiUrl.pathname),
      'options.apiRoot should be a subpath of options.cookiePath'
    );
    this.apiRootUrl = apiUrl;

    const redirectUrl = new URL(redirectRoot || '', serverUrl);
    invariant(
      !secure || redirectUrl.protocol === 'https:',
      'protocol of options.redirectRoot should be "https" when options.secure is set to true'
    );
    invariant(
      !cookieDomain || isSubdomain(cookieDomain, redirectUrl.hostname),
      'options.redirectRoot should be under a subdomain of options.cookieDomain'
    );
    invariant(
      isSubpath(cookiePath, redirectUrl.pathname),
      'options.redirectRoot should be under a subpath of options.cookiePath'
    );
    this.redirectRootUrl = redirectUrl;

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
        await thenifiedly.call(verifyJWT, encodedState, this.secret);

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
      this.secret
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
        this.secret
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
    { refreshTill }: { refreshTill?: number } = {}
  ): Promise<string> {
    const { secret, tokenLifetime, refreshDuration } = this;

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
    setCookie(res, TOKEN_COOKIE_KEY, tokenContent, this._tokenCookieOpts);

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
        this.secret
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
      this.secret
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

  getAuthUrl(platform: string, subpath?: string): string {
    return new URL(
      joinPath(this.apiRootUrl.pathname, platform, subpath || '/'),
      this.apiRootUrl
    ).href;
  }

  getRedirectUrl(path?: string): string {
    return new URL(path || '', joinPath(this.redirectRootUrl.href, '/')).href;
  }

  redirect(
    res: ServerResponse,
    url?: string,
    { assertInternal }: { assertInternal?: boolean } = {}
  ): boolean {
    const redirectRoot = this.redirectRootUrl;
    const redirectTarget = new URL(url || '', joinPath(redirectRoot.href, '/'));

    if (assertInternal) {
      const { protocol, host, pathname } = redirectTarget;

      if (
        (this.secure && protocol && protocol !== 'https:') ||
        host !== redirectRoot.host ||
        !isSubpath(redirectRoot.pathname, pathname)
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

  signToken(platform: string, payload: unknown, options?: SignOptions): string {
    return signJwt({ platform, payload }, this.secret, options);
  }

  verifyToken<Data>(assertedPlatform: string, token: string): null | Data {
    try {
      const { platform, payload } = verifyJWT(token, this.secret) as {
        platform: string;
        payload: Data;
      };
      if (platform !== assertedPlatform) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}

const OperatorP = makeClassProvider({
  deps: [ConfigsI],
  factory: (configs) => new AuthHttpOperator(configs),
})(AuthHttpOperator);
type OperatorP = AuthHttpOperator;

export default OperatorP;
