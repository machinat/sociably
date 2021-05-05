// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import { EventEmitter } from 'events';
import invariant from 'invariant';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { decode as decodeJwt } from 'jsonwebtoken';
import { TOKEN_COOKIE_KEY, ERROR_COOKIE_KEY } from '../constant';
import type {
  AnyClientAuthorizer,
  AnyAuthContext,
  ContextOfAuthorizer,
  AuthTokenPayload,
  ErrorTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthApiResponseBody,
  AuthApiErrorBody,
} from '../types';
import AuthError from '../error';

type AuthClientOptions<Authorizer extends AnyClientAuthorizer> = {
  serverUrl: string;
  authorizers: Authorizer[];
  refreshLeadTime?: number;
};

type SignInOptions = {
  platform?: string;
};

type AuthResult<Authorizer extends AnyClientAuthorizer> = {
  token: string;
  context: ContextOfAuthorizer<Authorizer>;
};

type TimeoutID = ReturnType<typeof setTimeout>;

const deleteCookie = (name: string, domain?: string, path?: string) => {
  document.cookie = serializeCookie(name, '', {
    expires: new Date(0),
    domain,
    path,
  });
};

const getAuthPayload = (token: string) =>
  decodeJwt(`${token}.`) as AuthTokenPayload<any>;

const getCookieAuthResult = (): [
  null | AuthError,
  null | { payload: AuthTokenPayload<unknown>; token: string }
] => {
  const cookies = parseCookie(document.cookie);

  if (cookies[ERROR_COOKIE_KEY]) {
    // Error happen in backend flow
    const decodedToken = decodeJwt(cookies[ERROR_COOKIE_KEY], { json: true });

    if (decodedToken !== null) {
      const {
        platform,
        error: { code, reason },
        scope: { domain, path },
      } = decodedToken as ErrorTokenPayload;

      deleteCookie(ERROR_COOKIE_KEY, domain, path);

      return [new AuthError(platform, code, reason), null as never];
    }
    deleteCookie(ERROR_COOKIE_KEY);
  } else if (cookies[TOKEN_COOKIE_KEY]) {
    // Auth completed in backend flow
    const token = cookies[TOKEN_COOKIE_KEY];
    const payload = getAuthPayload(token);

    if (payload.exp * 1000 > Date.now()) {
      return [null, { token, payload }];
    }
  }
  return [null, null];
};

class AuthClient<Authorizer extends AnyClientAuthorizer> extends EventEmitter {
  authorizers: Authorizer[];
  refreshLeadTime: number;

  private _platform: undefined | string;
  private _authUrl: URL;

  private _authed: null | {
    token: string;
    payload: AuthTokenPayload<unknown>;
    context: AnyAuthContext;
  };

  private _initiatingPlatforms: Set<string>;
  private _initiatedPlatforms: Set<string>;

  private _authPromise: null | Promise<AuthResult<Authorizer>>;
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

  getToken(): undefined | string {
    return this._authed?.token;
  }

  getAuthContext(): null | ContextOfAuthorizer<Authorizer> {
    return this._authed
      ? (this._authed.context as ContextOfAuthorizer<Authorizer>)
      : null;
  }

  getAuthorizer(): null | Authorizer {
    const [err, authorizer] = this._getAuthorizer(this.platform);
    return err ? null : authorizer;
  }

  constructor({
    authorizers,
    serverUrl,
    refreshLeadTime = 300, // 5 min
  }: AuthClientOptions<Authorizer>) {
    super();

    invariant(serverUrl, 'options.serverUrl must not be empty');
    invariant(
      authorizers && authorizers.length > 0,
      'options.authorizers must not be empty'
    );

    this.authorizers = authorizers;
    this.refreshLeadTime = refreshLeadTime;
    this._authUrl = new URL(serverUrl, window.location.href);

    this._initiatingPlatforms = new Set();
    this._initiatedPlatforms = new Set();
    this._minAuthBeginTime = -1;

    this._platform = undefined;
    this._authed = null;

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
  signIn({ platform }: SignInOptions = {}): Promise<AuthResult<Authorizer>> {
    if (!platform || platform === this._platform) {
      // return the result of current auth flow if it is authorizing
      if (this._authPromise) {
        return this._authPromise;
      }

      // return current auth status if it is already authorized
      if (this._authed) {
        const { token, context } = this._authed;
        return Promise.resolve({
          token,
          context: context as ContextOfAuthorizer<Authorizer>,
        });
      }
    }

    // bigin a new auth flow
    this._authPromise = this._auth(platform)
      .catch((err) => {
        this._emitError(err, this._authed?.context || null);
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

    let [cookieErr, cookieAuth] = getCookieAuthResult();
    // auth according to the following order
    const platform =
      platformInput ||
      this._platform ||
      new URLSearchParams(window.location.search).get('platform') ||
      cookieAuth?.payload.platform ||
      cookieErr?.platform;

    const [err, authorizer] = this._getAuthorizer(platform);
    if (err) {
      throw err;
    }

    if (this._platform && this._platform !== platform) {
      this.signOut();
    }

    this._platform = platform;
    if (platform !== (cookieErr?.platform || cookieAuth?.payload.platform)) {
      cookieErr = null;
      cookieAuth = null;
    }

    // init authorizer if needed
    if (
      !this._initiatedPlatforms.has(authorizer.platform) &&
      !this._initiatingPlatforms.has(authorizer.platform)
    ) {
      const platformAuthEntry = this._getAuthEntry(authorizer.platform);
      this._initiatingPlatforms.add(authorizer.platform);

      try {
        await authorizer.init(
          platformAuthEntry,
          cookieErr,
          cookieAuth?.payload.data || null
        );
      } finally {
        this._initiatingPlatforms.delete(authorizer.platform);
      }
      this._initiatedPlatforms.add(authorizer.platform);
    }

    let token: string;
    let payload: AuthTokenPayload<unknown>;

    if (cookieErr) {
      // error from back-end
      throw cookieErr;
    } else if (!cookieAuth || cookieAuth.payload.exp * 1000 < Date.now()) {
      // start front-end flow
      const [signErr, signedToken] = await this._signToken(authorizer);
      if (signErr) {
        throw signErr;
      }

      payload = getAuthPayload(signedToken);
      token = signedToken;
    } else {
      // use the success result from back-end
      ({ token, payload } = cookieAuth);
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
      context: context as ContextOfAuthorizer<Authorizer>,
    };
  }

  private async _signToken(
    provider: AnyClientAuthorizer
  ): Promise<[Error | null, string]> {
    const { platform } = provider;
    const result = await provider.fetchCredential(this._getAuthEntry(platform));

    if (!result.success) {
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
    { refreshTill }: AuthTokenPayload<unknown>
  ): Promise<void> {
    const beginTime = Date.now();

    const [err, authorizer] = this._getAuthorizer(this._platform);
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
      const [signErr, signedToken] = await this._signToken(authorizer);
      if (signErr) {
        throw signErr;
      }
      newToken = signedToken;
    }

    if (
      this._authed
        ? // auth updated during refreshment
          this._authed.token !== token
        : // signed out during refreshment
          beginTime < this._minAuthBeginTime
    ) {
      return;
    }

    const payload = getAuthPayload(newToken);
    const [ctxErr, context] = this._getAuthContext(payload);
    if (ctxErr) {
      throw ctxErr;
    }

    this._setAuth(newToken, payload, context);
    this.emit('refresh', context);
  }

  private _refreshAuthCallback = (
    token: string,
    payload: AuthTokenPayload<unknown>
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
  ): [null | AuthError, Authorizer] {
    if (!platform) {
      return [
        new AuthError(undefined, 400, 'no platform specified'),
        null as never,
      ];
    }

    const authorizer = this.authorizers.find((p) => p.platform === platform);
    if (!authorizer) {
      return [
        new AuthError(undefined, 400, `unknown platform "${platform}"`),
        null as never,
      ];
    }

    return [null, authorizer];
  }

  private _getAuthEntry(route: string) {
    const rootUrl = this._authUrl;
    const componentUrl = new URL(
      rootUrl.pathname.replace(/\/?$/, `/${route}`),
      rootUrl
    );
    return componentUrl.href;
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
    const [err, authorizer] = this._getAuthorizer(platform);
    if (err) {
      return [err, null as never];
    }

    const contextResult = authorizer.checkAuthContext(data);
    if (!contextResult.success) {
      return [new AuthError(platform, 400, 'invalid auth info'), null as never];
    }

    return [
      null,
      {
        ...contextResult.contextSupplment,
        platform: authorizer.platform,
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
      // by #auth() call
    }
  }
}

export default AuthClient;
