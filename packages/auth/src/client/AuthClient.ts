/// <reference lib="DOM" />
import { EventEmitter } from 'events';
import invariant from 'invariant';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { decode as decodeJwt } from 'jsonwebtoken';
import { TOKEN_COOKIE_KEY, ERROR_COOKIE_KEY } from '../constant';
import type {
  AnyClientAuthenticator,
  AnyAuthContext,
  ContextOfAuthenticator,
  AuthTokenPayload,
  ErrorTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthApiResponseBody,
  AuthApiErrorBody,
} from '../types';
import AuthError from '../error';

type AuthClientOptions<Authenticator extends AnyClientAuthenticator> = {
  serverUrl: string;
  authenticators: Authenticator[];
  refreshLeadTime?: number;
};

type SignInOptions = {
  platform?: string;
};

type AuthResult<Authenticator extends AnyClientAuthenticator> = {
  token: string;
  context: ContextOfAuthenticator<Authenticator>;
};

type TimeoutID = ReturnType<typeof setTimeout>;

const deleteCookie = (name: string, domain?: string, path?: string) => {
  document.cookie = serializeCookie(name, '', {
    expires: new Date(0),
    domain,
    path,
  });
};

const getAuthPayload = (
  token: string
): [null | AuthError, AuthTokenPayload<unknown>] => {
  try {
    const payload = decodeJwt(`${token}.`, { json: true });
    if (!payload) {
      return [
        new AuthError(undefined, 400, 'invalid token format'),
        null as never,
      ];
    }
    return [null, payload as AuthTokenPayload<unknown>];
  } catch (error) {
    return [new AuthError(undefined, 500, error.message), null as never];
  }
};

const getExistedAuthResult = (): [
  null | AuthError,
  null | { payload: AuthTokenPayload<unknown>; token: string }
] => {
  try {
    const cookies = parseCookie(document.cookie);

    if (cookies[ERROR_COOKIE_KEY]) {
      // Error happen in backend flow
      const payload = decodeJwt(cookies[ERROR_COOKIE_KEY], { json: true });

      if (payload !== null) {
        const {
          platform,
          error: { code, reason },
          scope: { domain, path },
        } = payload as ErrorTokenPayload;

        deleteCookie(ERROR_COOKIE_KEY, domain, path);
        return [new AuthError(platform, code, reason), null as never];
      }

      deleteCookie(ERROR_COOKIE_KEY);
    } else if (cookies[TOKEN_COOKIE_KEY]) {
      // Auth completed in backend flow
      const token = cookies[TOKEN_COOKIE_KEY];
      const [err, payload] = getAuthPayload(token);
      if (err) {
        deleteCookie(TOKEN_COOKIE_KEY);
        return [err, null];
      }

      return [null, { token, payload }];
    }

    return [null, null];
  } catch (error) {
    return [new AuthError(undefined, 500, error.message), null as never];
  }
};

class AuthClient<
  Authenticator extends AnyClientAuthenticator
> extends EventEmitter {
  authenticators: Authenticator[];
  refreshLeadTime: number;
  serverUrl: string;

  private _platform: undefined | string;
  private _authData: null | {
    token: string;
    payload: AuthTokenPayload<unknown>;
    context: AnyAuthContext;
  };

  private _initiatingPlatforms: Set<string>;
  private _initiatedPlatforms: Set<string>;

  private _authPromise: null | Promise<AuthResult<Authenticator>>;
  private _minAuthBeginTime: number;

  private _refreshTimeoutId: null | TimeoutID;
  private _expireTimeoutId: null | TimeoutID;

  get platform(): undefined | string {
    return this._platform;
  }

  get isAuthorized(): boolean {
    return !!this._authData;
  }

  get isAuthorizing(): boolean {
    return !!this._authPromise;
  }

  getToken(): undefined | string {
    return this._authData?.token;
  }

  getAuthContext(): null | ContextOfAuthenticator<Authenticator> {
    return this._authData
      ? (this._authData.context as ContextOfAuthenticator<Authenticator>)
      : null;
  }

  getAuthenticator(): null | Authenticator {
    const [err, authenticator] = this._getAuthenticator(this.platform);
    return err ? null : authenticator;
  }

  constructor({
    authenticators,
    serverUrl,
    refreshLeadTime = 300, // 5 min
  }: AuthClientOptions<Authenticator>) {
    super();
    invariant(serverUrl, 'options.serverUrl is required');
    invariant(authenticators, 'options.authenticators is required');

    this.authenticators = authenticators;
    this.refreshLeadTime = refreshLeadTime;
    this.serverUrl = serverUrl;

    this._initiatingPlatforms = new Set();
    this._initiatedPlatforms = new Set();
    this._minAuthBeginTime = -1;

    this._platform = undefined;
    this._authData = null;

    this._refreshTimeoutId = null;
    this._expireTimeoutId = null;
  }

  /**
   * Return the current token and auth context. For the first time being called,
   * controller starts the auth flow of the platform selected. The auth status
   * and following the refreshment and resign work would be managed by the
   * controller, so any auth() call after the first one do not trigger the auth
   * flow but just return the current status.
   */
  signIn({ platform }: SignInOptions = {}): Promise<AuthResult<Authenticator>> {
    if (!platform || platform === this._platform) {
      // return the result of current auth flow if it is authorizing
      if (this._authPromise) {
        return this._authPromise;
      }

      // return current auth status if it is already authorized
      if (this._authData) {
        const { token, context } = this._authData;
        return Promise.resolve({
          token,
          context: context as ContextOfAuthenticator<Authenticator>,
        });
      }
    }

    // begin a new auth flow
    this._authPromise = this._authFlow(platform)
      .catch((err) => {
        this._emitError(err, this._authData?.context || null);
        throw err;
      })
      .finally(() => {
        this._authPromise = null;
      });

    return this._authPromise;
  }

  /**
   * Sign out user.
   */
  signOut(): void {
    if (this._authData) {
      const { scope } = this._authData.payload;
      deleteCookie(TOKEN_COOKIE_KEY, scope.domain, scope.path);
      this._authData = null;
    }
    this._clearTimeouts();
    // Make sure auth operation executing now will not update auth
    this._minAuthBeginTime = Date.now();
  }

  private async _authFlow(
    platformInput: undefined | string
  ): Promise<AuthResult<Authenticator>> {
    const beginTime = Date.now();

    let [existedErr, existedAuth] = getExistedAuthResult();
    // use platform in the following order
    const platform =
      platformInput ||
      this._platform ||
      new URLSearchParams(window.location.search).get('platform') ||
      existedAuth?.payload.platform ||
      existedErr?.platform;

    const [err, authenticator] = this._getAuthenticator(platform);
    if (err) {
      throw err;
    }

    // sign out if platform is changed
    if (this._platform && this._platform !== platform) {
      this.signOut();
    }
    this._platform = platform;

    // don't use existed auth if platform is changed
    if (platform !== (existedErr?.platform || existedAuth?.payload.platform)) {
      existedErr = null;
      existedAuth = null;
    }

    // init authenticator if needed
    if (
      !this._initiatedPlatforms.has(authenticator.platform) &&
      !this._initiatingPlatforms.has(authenticator.platform)
    ) {
      const platformAuthEntry = this._getAuthEntry(authenticator.platform);
      this._initiatingPlatforms.add(authenticator.platform);

      try {
        await authenticator.init(
          platformAuthEntry,
          existedErr,
          existedAuth?.payload.data || null
        );
      } finally {
        this._initiatingPlatforms.delete(authenticator.platform);
      }
      this._initiatedPlatforms.add(authenticator.platform);
    }

    let token: string;
    let payload: AuthTokenPayload<unknown>;

    if (existedErr) {
      // got error from back-end
      throw existedErr;
    } else if (existedAuth && existedAuth.payload.exp * 1000 > Date.now()) {
      // use existed auth in the cookie
      ({ token, payload } = existedAuth);
    } else {
      let newToken: undefined | string;

      // refresh existed token if possible
      let refreshTill: undefined | number;
      if (
        (refreshTill = existedAuth?.payload.refreshTill) &&
        refreshTill * 1000 > Date.now()
      ) {
        const [refreshErr, body] = await this._callAuthPrivateApi('_refresh', {
          token: existedAuth.token,
        });
        if (!refreshErr) {
          newToken = body.token;
        }
      }

      if (!newToken) {
        // start front-end flow
        const [signErr, signedToken] = await this._signToken(authenticator);
        if (signErr) {
          throw signErr;
        }
        newToken = signedToken;
      }

      const [payloadErr, newPayload] = getAuthPayload(newToken);
      if (payloadErr) {
        throw payloadErr;
      }
      token = newToken;
      payload = newPayload;
    }

    // Update auth only when no signOut() call or another succeeded auth() call
    // have happened during the operation time
    if (beginTime < this._minAuthBeginTime) {
      throw new AuthError(undefined, 403, 'signed out during authenticating');
    }

    const [ctxErr, context] = this._getAuthContext(payload);
    if (ctxErr) {
      throw ctxErr;
    }

    // Block any other auth() call begun before this time from updating auth
    this._minAuthBeginTime = beginTime;
    this._setAuth(token, payload, context);

    return {
      token,
      context: context as ContextOfAuthenticator<Authenticator>,
    };
  }

  private async _signToken(
    authenticator: AnyClientAuthenticator
  ): Promise<[Error | null, string]> {
    const { platform } = authenticator;
    const result = await authenticator.fetchCredential(
      this._getAuthEntry(platform)
    );

    if (!result.ok) {
      const { code, reason } = result;
      return [new AuthError(platform, code, reason), ''];
    }

    const [err, body] = await this._callAuthPrivateApi('_sign', {
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
    context: AnyAuthContext
  ) {
    this._authData = { token, payload, context };
    this._clearTimeouts();

    const now = Date.now();
    const { exp } = payload;

    this._refreshTimeoutId = setTimeout(
      this._refreshFlowCallback,
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

  private async _refreshFlow(
    token: string,
    { refreshTill }: AuthTokenPayload<unknown>
  ): Promise<void> {
    const beginTime = Date.now();

    const [err, authenticator] = this._getAuthenticator(this._platform);
    if (err) {
      throw err;
    }

    let newToken: string;
    if (refreshTill && Date.now() < refreshTill * 1000) {
      // refresh if token is refreshable
      const [refreshErr, body] = await this._callAuthPrivateApi('_refresh', {
        token,
      });
      if (refreshErr) {
        throw refreshErr;
      }

      newToken = body.token;
    } else {
      const [signErr, signedToken] = await this._signToken(authenticator);
      if (signErr) {
        throw signErr;
      }
      newToken = signedToken;
    }

    if (
      this._authData
        ? // auth updated during refreshment
          this._authData.token !== token
        : // signed out during refreshment
          beginTime < this._minAuthBeginTime
    ) {
      return;
    }

    const [payloadErr, payload] = getAuthPayload(newToken);
    if (payloadErr) {
      throw payloadErr;
    }
    const [ctxErr, context] = this._getAuthContext(payload);
    if (ctxErr) {
      throw ctxErr;
    }

    this._setAuth(newToken, payload, context);
    this.emit('refresh', context);
  }

  private _refreshFlowCallback = (
    token: string,
    payload: AuthTokenPayload<unknown>
  ) => {
    this._refreshTimeoutId = null;

    this._refreshFlow(token, payload).catch((err) => {
      this._emitError(err, this._authData?.context || null);
    });
  };

  private _expireTokenCallback = (token: string) => {
    this._expireTimeoutId = null;

    const data = this._authData;
    if (data && data.token === token) {
      this._authData = null;
      this.emit('expire', data.context);
    }
  };

  private _getAuthenticator(
    platform: undefined | string
  ): [null | AuthError, Authenticator] {
    if (!platform) {
      return [
        new AuthError(undefined, 400, 'no platform specified'),
        null as never,
      ];
    }

    const authenticator = this.authenticators.find(
      (p) => p.platform === platform
    );
    if (!authenticator) {
      return [
        new AuthError(undefined, 400, `unknown platform "${platform}"`),
        null as never,
      ];
    }

    return [null, authenticator];
  }

  private _getAuthEntry(route: string) {
    const rootUrl = new URL(this.serverUrl, window.location.href);
    const platformApiUrl = new URL(
      rootUrl.pathname.replace(/\/?$/, `/${route}`),
      rootUrl
    );
    return platformApiUrl.href;
  }

  private async _callAuthPrivateApi(
    api: string,
    body: SignRequestBody<unknown> | RefreshRequestBody | VerifyRequestBody
  ): Promise<[null | AuthError, AuthApiResponseBody]> {
    const res = await fetch(this._getAuthEntry(api), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const {
        platform,
        error: { code, reason },
      }: AuthApiErrorBody = await res.json();
      return [new AuthError(platform, code, reason), null as never];
    }

    const result = await res.json();
    return [null, result];
  }

  private _getAuthContext(
    payload: AuthTokenPayload<unknown>
  ): [null | AuthError, AnyAuthContext] {
    const { platform, data, iat, exp } = payload;
    const [err, authenticator] = this._getAuthenticator(platform);
    if (err) {
      return [err, null as never];
    }

    const checkResult = authenticator.checkAuthData(data);
    if (!checkResult.ok) {
      return [new AuthError(platform, 400, 'invalid auth info'), null as never];
    }

    return [
      null,
      {
        ...checkResult.contextDetails,
        platform: authenticator.platform,
        loginAt: new Date(iat * 1000),
        expireAt: new Date(exp * 1000),
      },
    ];
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

  private _emitError(err: Error, context: null | AnyAuthContext) {
    try {
      this.emit('error', err, context);
    } catch {
      // do not throw if no error handler, since the error can also be received
      // by #signIn() call
    }
  }
}

export default AuthClient;
