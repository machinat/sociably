// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import { EventEmitter } from 'events';
import invariant from 'invariant';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { decode as decodeJWT } from 'jsonwebtoken';
import { TOKEN_COOKIE_KEY, ERROR_COOKIE_KEY } from '../constant';
import type {
  AuthContext,
  ClientAuthorizer,
  AuthTokenPayload,
  ErrorTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthAPIResponseBody,
  AuthAPIErrorBody,
} from '../types';
import AuthError from './error';

type AnyClientAuthorizer = ClientAuthorizer<any, any, unknown, unknown>;

type AuthClientOptions<Authorizer extends AnyClientAuthorizer> = {
  platform?: string;
  serverURL: string;
  authorizers: Authorizer[];
  refreshLeadTime?: number;
};

type AuthResult<Authorizer extends AnyClientAuthorizer> = {
  token: string;
  context: Authorizer extends ClientAuthorizer<
    infer User,
    infer Channel,
    infer AuthData,
    unknown
  >
    ? AuthContext<User, Channel, AuthData>
    : never;
};

type CookieAuthResult<AuthData> =
  | { success: false; platform: string; code: number; reason: string }
  | {
      success: true;
      platform: string;
      token: string;
      payload: AuthTokenPayload<AuthData>;
    };

type TimeoutID = ReturnType<typeof setTimeout>;

/** @internal */
const deleteCookie = (name: string, domain?: string, path?: string) => {
  document.cookie = serializeCookie(name, '', {
    expires: new Date(0),
    domain,
    path,
  });
};

/** @internal */
const getAuthPayload = (token: string): AuthTokenPayload<any> =>
  decodeJWT(`${token}.`) as AuthTokenPayload<any>;

/** @internal */
const getCookieAuthResult = <AuthData>(): null | CookieAuthResult<AuthData> => {
  const cookies = parseCookie(document.cookie);

  if (cookies[ERROR_COOKIE_KEY]) {
    // Error happen in backend flow
    const decodedToken = decodeJWT(cookies[ERROR_COOKIE_KEY], { json: true });

    if (decodedToken !== null) {
      const {
        platform,
        error: { code, reason },
        scope: { domain, path },
      } = decodedToken as ErrorTokenPayload;

      deleteCookie(ERROR_COOKIE_KEY, domain, path);
      return {
        success: false,
        platform,
        code,
        reason,
      };
    }
    deleteCookie(ERROR_COOKIE_KEY);
  } else if (cookies[TOKEN_COOKIE_KEY]) {
    // Auth completed in backend flow
    const token = cookies[TOKEN_COOKIE_KEY];
    const payload = getAuthPayload(token);

    if (payload.exp * 1000 > Date.now()) {
      return {
        success: true,
        platform: payload.platform,
        token,
        payload,
      };
    }
  }

  return null;
};

class AuthClient<Authorizer extends AnyClientAuthorizer> extends EventEmitter {
  authorizers: Authorizer[];
  serverURL: string;
  refreshLeadTime: number;

  private _platform: undefined | string;
  private _authURL: URL;

  private _authed: null | {
    token: string;
    payload: AuthTokenPayload<unknown>;
    context: AuthContext<any, any, unknown>;
  };

  private _initiatingPlatforms: Set<string>;
  private _initiatedPlatforms: Set<string>;

  private _authPromise: null | Promise<AuthResult<Authorizer>>;
  private _initialAuthPromise: null | Promise<AuthResult<Authorizer>>;

  private _minAuthBeginTime: number;

  private _refreshTimeoutId: null | TimeoutID;
  private _expireTimeoutId: null | TimeoutID;

  get platform(): undefined | string {
    return this._platform;
  }

  get isAuthorized(): boolean {
    return !!this._authed;
  }

  get isAuthorizing(): boolean {
    return !!this._authPromise;
  }

  constructor({
    platform,
    authorizers,
    serverURL,
    refreshLeadTime = 300, // 5 min
  }: AuthClientOptions<Authorizer>) {
    super();

    invariant(serverURL, 'options.serverURL must not be empty');
    invariant(
      authorizers && authorizers.length > 0,
      'options.authorizers must not be empty'
    );

    this.authorizers = authorizers;
    this.serverURL = serverURL;
    this.refreshLeadTime = refreshLeadTime;
    this._authURL = new URL(serverURL, window.location.href);

    this._initiatingPlatforms = new Set();
    this._initiatedPlatforms = new Set();
    this._minAuthBeginTime = -1;

    this._platform = undefined;
    this._authed = null;

    this._refreshTimeoutId = null;
    this._expireTimeoutId = null;

    this._initialAuthPromise = this.auth(platform);
  }

  /**
   * Return the current token and auth context. For the first time being called,
   * controller starts the auth flow of the platform selected. The auth status
   * and following the refreshment and resign work would be managed by the
   * controller, so any auth() call after the first one do not trigger the auth
   * flow but just return the current status.
   */
  auth(platform?: string): Promise<AuthResult<Authorizer>> {
    // the first auth() call should return the initial auth result
    if (this._initialAuthPromise) {
      const initialAuthPromise = this._initialAuthPromise;
      this._initialAuthPromise = null;

      if (!platform || platform === this._platform) {
        return initialAuthPromise;
      }
    }

    if (!platform || platform === this._platform) {
      // return the result of current auth flow if it is authorizing
      if (this._authPromise) {
        return this._authPromise;
      }

      // return current auth status if it is already authorized
      if (this._authed) {
        const { token, context } = this._authed;
        return Promise.resolve({ token, context: context as any });
      }
    }

    // bigin a new auth flow
    this._authPromise = this._auth(platform).finally(() => {
      this._authPromise = null;
    });

    this._authPromise.catch((err) => {
      this._emitError(err, this._authed?.context || null);
    });

    return this._authPromise;
  }

  /**
   * Sign out user.
   */
  signOut(): void {
    if (this._authed) {
      const { scope } = this._authed.payload;
      deleteCookie(TOKEN_COOKIE_KEY, scope.domain, scope.path);
      this._authed = null;
    }
    this._clearTimeouts();
    // Make sure auth operation executing now will not update auth
    this._minAuthBeginTime = Date.now();
  }

  private async _auth(
    platformInput: undefined | string
  ): Promise<AuthResult<Authorizer>> {
    const beginTime = Date.now();

    let cookieAuthResult = getCookieAuthResult();
    // auth according to the following order
    const authPlatform =
      platformInput ||
      this._platform ||
      new URLSearchParams(window.location.search).get('platform') ||
      cookieAuthResult?.platform;

    const [err, authorizer] = this._getAuthorizer(authPlatform);
    if (err) {
      throw err;
    }

    if (this._platform && this._platform !== authPlatform) {
      this.signOut();
    }

    this._platform = authPlatform;
    if (cookieAuthResult?.platform !== authPlatform) {
      cookieAuthResult = null;
    }

    // init authorizer if needed
    if (
      !this._initiatedPlatforms.has(authorizer.platform) &&
      !this._initiatingPlatforms.has(authorizer.platform)
    ) {
      const platformAuthEntry = this._getAuthEntry(authorizer.platform);
      this._initiatingPlatforms.add(authorizer.platform);

      try {
        if (cookieAuthResult) {
          if (cookieAuthResult.success) {
            await authorizer.init(
              platformAuthEntry,
              cookieAuthResult.payload.data,
              null
            );
          } else {
            const { code, reason } = cookieAuthResult;
            await authorizer.init(platformAuthEntry, null, { code, reason });
          }
        } else {
          await authorizer.init(platformAuthEntry, null, null);
        }
      } finally {
        this._initiatingPlatforms.delete(authorizer.platform);
      }

      this._initiatedPlatforms.add(authorizer.platform);
    }

    let token: string;
    let payload: AuthTokenPayload<any>;

    if (
      !cookieAuthResult ||
      (cookieAuthResult.success &&
        cookieAuthResult.payload.exp * 1000 < Date.now())
    ) {
      // start front-end flow
      const [signErr, signedToken] = await this._signToken(authorizer);
      if (signErr) {
        throw signErr;
      }

      payload = getAuthPayload(signedToken);
      token = signedToken;
    } else if (!cookieAuthResult.success) {
      // error from back-end
      const { code, reason } = cookieAuthResult;
      throw new AuthError(code, reason);
    } else {
      // use the success result from back-end
      ({ token, payload } = cookieAuthResult);
    }

    // Update auth only when no signOut() call or another succeeded auth() call
    // have happened during the operation time
    if (beginTime < this._minAuthBeginTime) {
      throw new AuthError(403, 'signed out during authenticating');
    }

    const refinement = await authorizer.refineAuth(payload.data);
    if (!refinement) {
      throw new AuthError(400, 'invalid auth info');
    }

    const { iat, exp, data } = payload;
    const { channel, user } = refinement;
    const context = {
      platform: authorizer.platform,
      loginAt: new Date(iat * 1000),
      expireAt: new Date(exp * 1000),
      channel,
      user,
      data,
    };

    // Block any other auth() call begun before this time from updating auth
    this._minAuthBeginTime = beginTime;
    this._setAuth(token, payload, context);

    return { token, context: context as any };
  }

  private async _signToken(
    provider: AnyClientAuthorizer
  ): Promise<[Error | null, string]> {
    const { platform } = provider;
    const result = await provider.fetchCredential(this._getAuthEntry(platform));

    if (!result.success) {
      const { code, reason } = result;
      return [new AuthError(code, reason), ''];
    }

    const [err, body] = await this._callAuthPrivateAPI('_sign', {
      platform,
      credential: result.credential,
    });

    if (err) {
      return [err, ''];
    }

    return [null, body.token];
  }

  private _setAuth(
    token: string,
    payload: AuthTokenPayload<unknown>,
    context: AuthContext<any, any, unknown>
  ) {
    this._authed = { token, payload, context };
    this._clearTimeouts();

    const now = Date.now();
    const { exp } = payload;

    this._refreshTimeoutId = setTimeout(
      this._refreshAuthCallback,
      (exp - this.refreshLeadTime) * 1000 - now,
      token,
      payload
    );

    this._expireTimeoutId = setTimeout(
      this._expireTokenCallback,
      exp * 1000 - now,
      token
    );
  }

  private async _refreshAuth(
    token: string,
    { refreshLimit }: AuthTokenPayload<unknown>
  ): Promise<void> {
    const beginTime = Date.now();

    const [err, authorizer] = this._getAuthorizer(this._platform);
    if (err) {
      throw err;
    }

    let newToken: string;
    if (refreshLimit && Date.now() < refreshLimit * 1000) {
      // refresh if token is refreshable
      const [refreshErr, body] = await this._callAuthPrivateAPI('_refresh', {
        token,
      });
      if (refreshErr) {
        throw refreshErr;
      }

      newToken = body.token;
    } else if (authorizer.shouldResign) {
      // otherwise resign
      const [signErr, signedToken] = await this._signToken(authorizer);
      if (signErr) {
        throw signErr;
      }
      newToken = signedToken;
    } else {
      return;
    }

    if (
      this._authed
        ? // if auth updated during refreshment
          this._authed.token !== token
        : // if signed out during refreshment
          beginTime < this._minAuthBeginTime
    ) {
      return;
    }

    const payload = getAuthPayload(newToken);
    const refinement = await authorizer.refineAuth(payload.data);
    if (!refinement) {
      throw new AuthError(400, 'invalid auth info');
    }

    const { iat, exp, data } = payload;
    const { channel, user } = refinement;
    const context = {
      platform: authorizer.platform,
      loginAt: new Date(iat * 1000),
      expireAt: new Date(exp * 1000),
      channel,
      user,
      data,
    };

    this._setAuth(newToken, payload, context);
    this.emit('refresh', context);
  }

  private _refreshAuthCallback = (
    token: string,
    payload: AuthTokenPayload<any>
  ) => {
    this._refreshTimeoutId = null;

    this._refreshAuth(token, payload).catch((err) => {
      this._emitError(err, this._authed?.context || null);
    });
  };

  private _expireTokenCallback = (token: string) => {
    this._expireTimeoutId = null;

    const authed = this._authed;
    if (authed && authed.token === token) {
      this._authed = null;
      this.emit('expire', authed.context);
    }
  };

  private _getAuthorizer(
    platform: undefined | string
  ): [null | Error, Authorizer] {
    if (!platform) {
      return [new AuthError(400, 'no platform specified'), null as any];
    }

    const authorizer = this.authorizers.find((p) => p.platform === platform);
    if (!authorizer) {
      return [
        new AuthError(400, `unknown platform "${platform}"`),
        null as any,
      ];
    }

    return [null, authorizer];
  }

  private _getAuthEntry(route: string) {
    const rootURL = this._authURL;
    const componentURL = new URL(
      rootURL.pathname.replace(/\/?$/, `/${route}`),
      rootURL
    );
    return componentURL.href;
  }

  private async _callAuthPrivateAPI(
    api: string,
    body: SignRequestBody<unknown> | RefreshRequestBody | VerifyRequestBody
  ): Promise<[Error | null, AuthAPIResponseBody]> {
    const res = await fetch(this._getAuthEntry(api), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const {
        error: { code, reason },
      }: AuthAPIErrorBody = await res.json();
      return [new AuthError(code, reason), null as any];
    }

    const result = await res.json();
    return [null, result];
  }

  private _clearTimeouts() {
    if (this._refreshTimeoutId) {
      clearTimeout(this._refreshTimeoutId);
      this._refreshTimeoutId = null;
    }

    if (this._expireTimeoutId) {
      clearTimeout(this._expireTimeoutId);
      this._expireTimeoutId = null;
    }
  }

  private _emitError(
    err: Error,
    context: null | AuthContext<any, any, unknown>
  ) {
    try {
      this.emit('error', err, context);
    } catch {
      // do not throw if no error handler, since the error can also be received
      // by #auth() call
    }
  }
}

export default AuthClient;
