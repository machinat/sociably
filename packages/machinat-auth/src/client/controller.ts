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

type AuthClientOptions = {
  serverURL: string;
  authorizers: ClientAuthorizer<any, any>[];
  refreshLeadTime?: number;
};

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

type ServerSideResult =
  | { success: false; platform: string; code: number; reason: string }
  | {
      success: true;
      platform: string;
      token: string;
      payload: AuthTokenPayload<any>;
    };

type TimeoutID = ReturnType<typeof setTimeout>;

class AuthClientController extends EventEmitter {
  authorizers: ClientAuthorizer<any, any>[];
  serverURL: string;
  refreshLeadTime: number;

  private _platform: undefined | string;
  private _authURL: URL;

  private _serverSideResult: ServerSideResult | null | undefined;
  private _authed: null | {
    token: string;
    payload: AuthTokenPayload<any>;
    context: AuthContext<any>;
  };

  private _initiatingPlatforms: Set<string>;
  private _initiatedPlatforms: Set<string>;

  private _initPromise: null | Promise<void>;
  private _authPromise: null | Promise<{
    token: string;
    context: AuthContext<any>;
  }>;

  private _minAuthBeginTime: number;

  private _refreshTimeoutId: null | TimeoutID;
  private _expireTimeoutId: null | TimeoutID;

  get platform(): undefined | string {
    return this._platform;
  }

  get isInitiating(): boolean {
    return !!this._initPromise;
  }

  get isAuthed(): boolean {
    return !!this._authed;
  }

  constructor(
    {
      authorizers,
      serverURL,
      refreshLeadTime = 300, // 5 min
    }: AuthClientOptions = {} as any
  ) {
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
    this._initPromise = null;
    this._minAuthBeginTime = -1;

    this._platform = undefined;
    this._authed = null;

    this._refreshTimeoutId = null;
    this._expireTimeoutId = null;
  }

  isInitiated(platform: string): boolean {
    return this._initiatedPlatforms.has(platform);
  }

  /**
   * Initiate the nessesary libs or works for the following auth flow. You might
   * want to call it as earlier as possible before your app start rendering, you
   * can then call auth() to sign in after your app is ready.
   * The platform to log user in is decided with the order below:
   *   bootstrap() param -> "platform" querystring param -> backend flow setup
   * If you want to change the platform, call bootstrap() again with new
   * platform then call auth() again.
   */
  bootstrap(platformInput?: string): AuthClientController {
    const cookies = parseCookie(document.cookie);
    let serverSideResult: null | ServerSideResult = null;

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
        serverSideResult = {
          success: false,
          platform,
          code,
          reason,
        };
      } else {
        deleteCookie(ERROR_COOKIE_KEY);
      }
    } else if (cookies[TOKEN_COOKIE_KEY]) {
      // Auth completed in backend flow
      const token = cookies[TOKEN_COOKIE_KEY];
      const payload = getAuthPayload(token);

      if (payload.exp * 1000 > Date.now()) {
        serverSideResult = {
          success: true,
          platform: payload.platform,
          token,
          payload,
        };
      }
    }

    const platformToBootstrap =
      platformInput ||
      new URLSearchParams(window.location.search).get('platform') ||
      serverSideResult?.platform;

    const [err, provider] = this._getProvider(platformToBootstrap);
    if (err) {
      this.emit('error', err, this._authed?.context || null);
      return this;
    }

    if (this._platform && this._platform !== platformToBootstrap) {
      this.signOut();
    }

    this._platform = platformToBootstrap;
    this._serverSideResult =
      serverSideResult?.platform === platformToBootstrap
        ? serverSideResult
        : null;

    // Execute init work of platform, promise would be awaited within auth()
    const initPromise = this._initPlatform(provider, this._serverSideResult)
      .catch((initErr) => {
        this.emit('error', initErr, this._authed?.context || null);
      })
      .finally(() => {
        // if init success and no other init() call make the platform changed
        if (this._initPromise === initPromise) {
          this._initPromise = null;
        }
      });

    this._initPromise = initPromise;
    return this;
  }

  /**
   * Return the current token and auth context. For the first time being called,
   * controller starts the auth flow of the platform selected. The auth status
   * and following the refreshment and resign work would be managed by the
   * controller, so any auth() call after the first one do not trigger the auth
   * flow but just return the current status.
   */
  async auth(): Promise<{ token: string; context: AuthContext<any> }> {
    if (this._authPromise) {
      return this._authPromise;
    }

    if (this._authed) {
      const { token, context } = this._authed;
      return { token, context };
    }

    this._authPromise = this._auth().finally(() => {
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

  private async _initPlatform(
    authorizer: ClientAuthorizer<any, any>,
    serverSideResult: null | ServerSideResult
  ): Promise<void> {
    // not initiate for the same platform again
    if (
      !this._initiatedPlatforms.has(authorizer.platform) &&
      !this._initiatingPlatforms.has(authorizer.platform)
    ) {
      const platformAuthEntry = this._getAuthEntry(authorizer.platform);

      this._initiatingPlatforms.add(authorizer.platform);
      try {
        if (serverSideResult) {
          if (serverSideResult.success) {
            await authorizer.init(
              platformAuthEntry,
              serverSideResult.payload.data,
              null
            );
          } else {
            const { code, reason } = serverSideResult;
            await authorizer.init(platformAuthEntry, null, { code, reason });
          }
        } else {
          await authorizer.init(platformAuthEntry, null, null);
        }
      } finally {
        this._initiatingPlatforms.delete(authorizer.platform);
      }

      this._initiatedPlatforms.add(authorizer.platform);
      // set as initiated if platform is not changed by another call
      if (this._platform === authorizer.platform) {
        this.emit('initiate');
      }
    }
  }

  private async _auth(): Promise<{ token: string; context: AuthContext<any> }> {
    const beginTime = Date.now();
    let err: undefined | null | Error;

    while (this._initPromise) {
      // Wait for initiation for the first time
      await this._initPromise; // eslint-disable-line no-await-in-loop
    }

    if (!this._platform) {
      // Initiation failed or not init() at all
      throw new AuthError(400, 'controller not boostrapped');
    }

    const [providerErr, provider] = this._getProvider(this._platform);
    if (providerErr) {
      throw providerErr;
    }

    const serverSideResult = this._serverSideResult;
    let token: string;
    let payload: AuthTokenPayload<any>;

    if (
      !serverSideResult ||
      (serverSideResult.success &&
        serverSideResult.payload.exp * 1000 < Date.now())
    ) {
      [err, token] = await this._signToken(provider);
      if (err) {
        throw err;
      }

      payload = getAuthPayload(token);
    } else if (!serverSideResult.success) {
      const { code, reason } = serverSideResult;
      throw new AuthError(code, reason);
    } else {
      ({ token, payload } = serverSideResult);
    }

    // Update auth only when no signOut() call or another succeeded auth() call
    // have happened during the operation time
    if (beginTime < this._minAuthBeginTime) {
      throw new AuthError(403, 'signed out during authenticating');
    }

    const refinement = await provider.refineAuth(payload.data);
    if (!refinement) {
      throw new AuthError(400, 'invalid auth info');
    }

    const { iat, exp, data } = payload;
    const { channel, user } = refinement;
    const context = {
      platform: provider.platform,
      loginAt: new Date(iat * 1000),
      expireAt: new Date(exp * 1000),
      channel,
      user,
      data,
    };

    // Block any other auth() call begun before this time from updating auth
    this._minAuthBeginTime = beginTime;
    this._setAuth(token, payload, context);

    return { token, context };
  }

  private async _signToken(
    provider: ClientAuthorizer<any, any>
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
    payload: AuthTokenPayload<any>,
    context: AuthContext<any>
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
    { refreshLimit }: AuthTokenPayload<any>
  ): Promise<void> {
    const beginTime = Date.now();

    let err: null | Error;
    let provider: ClientAuthorizer<any, any>;
    [err, provider] = this._getProvider(this._platform); // eslint-disable-line prefer-const
    if (err) {
      throw err;
    }

    let newToken: string;
    if (refreshLimit && Date.now() < refreshLimit * 1000) {
      // refresh if token is refreshable
      let body: AuthAPIResponseBody;
      [err, body] = await this._callAuthPrivateAPI('_refresh', { token });

      if (err) {
        throw err;
      }

      newToken = body.token;
    } else if (provider.shouldResign) {
      // otherwise resign
      [err, newToken] = await this._signToken(provider);
      if (err) {
        throw err;
      }
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
    const refinement = await provider.refineAuth(payload.data);
    if (!refinement) {
      throw new AuthError(400, 'invalid auth info');
    }

    const { iat, exp, data } = payload;
    const { channel, user } = refinement;
    const context = {
      platform: provider.platform,
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
      this.emit('error', err, this._authed?.context || null);
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

  private _getProvider(
    platform: undefined | string
  ): [Error | null, ClientAuthorizer<any, any>] {
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
    body: SignRequestBody<any> | RefreshRequestBody | VerifyRequestBody
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
}

export default AuthClientController;
