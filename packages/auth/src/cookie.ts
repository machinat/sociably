import type { IncomingMessage, ServerResponse } from 'http';
import type { CookieSerializeOptions } from 'cookie';
import { sign as signJWT, verify as verifyJWT } from 'jsonwebtoken';
import thenifiedly from 'thenifiedly';
import type {
  AuthPayload,
  StatePayload,
  ErrorPayload,
  AuthTokenPayload,
  StateTokenPayload,
  ErrorTokenPayload,
  ErrorMessage,
} from './types';
import { getCookies, setCookie } from './utils';

import {
  STATE_COOKIE_KEY,
  TOKEN_COOKIE_KEY,
  SIGNATURE_COOKIE_KEY,
  ERROR_COOKIE_KEY,
} from './constant';

type OperatorOptions = {
  entryPath: string;
  secret: string;
  dataCookieAge: number;
  tokenAge: number;
  refreshPeriod: number;
  cookieDomain?: string;
  cookiePath: string;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
};

type IssueAuthOptions = {
  refreshTill?: number;
  refreshable?: boolean;
  signatureOnly?: boolean;
};

export class CookieController {
  options: OperatorOptions;

  private _cookieScope: { domain?: string; path: string };

  private _tokenCookieOpts: CookieSerializeOptions;
  private _errorCookieOpts: CookieSerializeOptions;
  private _signatureCookieOpts: CookieSerializeOptions;
  private _stateCookieOpts: CookieSerializeOptions;
  private _deleteCookieOpts: CookieSerializeOptions;

  constructor(options: OperatorOptions) {
    this.options = options;

    const {
      entryPath,
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
      maxAge: dataCookieAge,
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
      const {
        platform,
        state,
      }: StateTokenPayload<State> = await thenifiedly.call(
        verifyJWT,
        encodedState,
        this.options.secret
      );

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
      signJWT,
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

    const token = await thenifiedly.call(signJWT, payload, secret, {
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
      signJWT,
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
}

export class CookieAccessor {
  _req: IncomingMessage;
  _res: ServerResponse;
  _platform: string;
  _controller: CookieController;

  constructor(
    req: IncomingMessage,
    res: ServerResponse,
    platform: string,
    operator: CookieController
  ) {
    this._req = req;
    this._res = res;
    this._platform = platform;
    this._controller = operator;
  }

  getState<State>(): Promise<null | State> {
    return this._controller.getState<State>(this._req, this._platform);
  }

  issueState<State>(state: State): Promise<string> {
    return this._controller.issueState<State>(this._res, this._platform, state);
  }

  getAuth<Context>(): Promise<null | Context> {
    return this._controller.getAuth<Context>(this._req, this._platform);
  }

  issueAuth<Context>(
    auth: Context,
    options?: IssueAuthOptions
  ): Promise<string> {
    return this._controller.issueAuth<Context>(
      this._res,
      this._platform,
      auth,
      options
    );
  }

  getError(): Promise<null | ErrorMessage> {
    return this._controller.getError(this._req, this._platform);
  }

  issueError(code: number, message: string): Promise<string> {
    return this._controller.issueError(
      this._res,
      this._platform,
      code,
      message
    );
  }
}
