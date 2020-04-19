// @flow
import EventEmitter from 'events';
import invariant from 'invariant';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { decode as decodeJWT } from 'jsonwebtoken';
import { TOKEN_COOKIE_KEY, ERROR_COOKIE_KEY } from '../constant';
import type {
  AuthInfo,
  ClientAuthorizer,
  AuthTokenPayload,
  ErrorTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthAPIResponseBody,
  AuthAPIResponseErrorBody,
  AuthRefineResult,
} from '../types';
import AuthError from './error';

type AuthClientOptions = {|
  authEntry: string,
  providers: ClientAuthorizer<any, any>[],
  refreshLeadTime?: number,
|};

declare var location: Location;
declare var document: Document;
declare var fetch: (url: string, options: Object) => Object;

const makeContext = (
  { platform, iat, exp, data }: AuthTokenPayload<any>,
  { user, authorizedChannel }: AuthRefineResult
) => ({
  platform,
  loginAt: new Date(iat * 1000),
  expireAt: new Date(exp * 1000),
  authorizedChannel,
  user,
  data,
});

const deleteCookie = (name: string, domain?: string, path?: string) => {
  document.cookie = serializeCookie(name, '', {
    expires: new Date(0),
    domain,
    path,
  });
};

const getAuthPayload = (token: string): AuthTokenPayload<any> =>
  decodeJWT(`${token}.`);

class AuthClientController extends EventEmitter {
  providers: ClientAuthorizer<any, any>[];
  authEntry: string;
  refreshLeadTime: number;

  _platform: void | string;
  _authURL: URL;

  _authed: null | {|
    token: void | string,
    payload: AuthTokenPayload<any>,
    context: AuthInfo<any>,
  |};

  _initedFlag: boolean;
  _initedPlatforms: Set<string>;
  _initPromise: null | Promise<void>;
  _minAuthBegin: number;

  _initialError: null | Error;
  _initialAuth: null | {| token: string, payload: AuthTokenPayload<any> |};

  _refreshTimeoutId: null | TimeoutID;
  _expireTimeoutId: null | TimeoutID;

  get platform() {
    return this._platform;
  }

  get isInitiated() {
    return !this._initPromise && this._initedFlag;
  }

  get isInitiating() {
    return !!this._initPromise;
  }

  get isAuthed() {
    return !!this._authed;
  }

  get authContext() {
    return this._authed && this._authed.context;
  }

  constructor({
    providers,
    authEntry,
    refreshLeadTime = 300, // 5 min
  }: AuthClientOptions = {}) {
    invariant(authEntry, 'options.authEntry must not be empty');
    invariant(
      providers && providers.length > 0,
      'options.providers must not be empty'
    );

    super();

    this.providers = providers;
    this.authEntry = authEntry;
    this.refreshLeadTime = refreshLeadTime;
    this._authURL = new URL(authEntry, location.href);

    this._initedFlag = false;
    this._initedPlatforms = new Set();
    this._initPromise = null;
    this._minAuthBegin = -1;

    this._initialError = null;
    this._initialAuth = null;

    this._platform = undefined;
    this._authed = null;

    this._refreshTimeoutId = null;
    this._expireTimeoutId = null;
  }

  /**
   * Initiate the nessesary libs or works for the following auth flow. It should
   * be called as earlier as possible before your app start rendering, you can
   * then call auth() to sign in after your app is ready.
   * The platform to sign user in is decided with the order below:
   *   init() param -> "platform" querystring param -> backend flow setup
   * If you want to change the platform, call init() again with new platform
   * then call auth() again.
   */
  init(platformInput?: string) {
    const cookies = parseCookie(document.cookie);
    let platform;

    if (cookies[ERROR_COOKIE_KEY]) {
      // Error happen in backend flow
      const {
        platform: errorPlatform,
        error: { code, reason },
        scope: { domain, path },
      }: ErrorTokenPayload = decodeJWT(cookies[ERROR_COOKIE_KEY]);
      deleteCookie(ERROR_COOKIE_KEY, domain, path);

      platform = errorPlatform;
      this._initialError = new AuthError(code, reason);
    } else if (cookies[TOKEN_COOKIE_KEY]) {
      // Auth completed in backend flow
      const token = cookies[TOKEN_COOKIE_KEY];
      const payload = getAuthPayload(token);

      ({ platform } = payload);
      this._initialAuth = { token, payload };
    }

    const platformSpecified =
      platformInput || new URLSearchParams(location.search).get('platform');

    if (platformSpecified && platformSpecified !== platform) {
      // Ignore data in cookie if different platform specified in query
      platform = platformSpecified;
      this._initialAuth = null;
      this._initialError = null;
    }

    // Execute init work of platform, promise would be awaited within auth()
    this._initPromise = this._initProvider(platform)
      .catch(err => {
        this.emit('error', err);
      })
      .finally(() => {
        // if init success and no other init() call change the platform
        if (this._platform === platform || !this._platform) {
          this._initPromise = null;
        }
      });
  }

  /**
   * Execute the auth flow immediatly. If user is already signed in, it would
   * update auth after succeeded but remain the original auth status when fail.
   * It resolves an AuthInfo object, but if any signOut() or another auth()
   * call change the auth status during operation, a null instead.
   */
  async auth(): Promise<AuthInfo<any>> {
    const beginTime = Date.now();
    if (this._initPromise) {
      // Wait for initiation for the first time
      await this._initPromise;
    }

    if (!this.isInitiated) {
      // Initiation failed or not init() at all
      throw new AuthError(400, 'controller not initiated');
    }

    if (this._initialError) {
      // Throw if error happen in backend flow
      const err = this._initialError;
      this._initialError = null;
      throw err;
    }

    const provider = this._getProviderAssertedly(this._platform);

    let token;
    let payload;
    if (
      this._initialAuth &&
      this._initialAuth.payload.exp * 1000 > Date.now()
    ) {
      // auth already completed in backend flow
      ({ token, payload } = this._initialAuth);
      this._initialAuth = null;
    } else {
      token = await this._signToken(provider);
      payload = getAuthPayload(token);
    }

    // Update auth only when no signOut() call or another succeeded auth() call
    // have happened during the operation time
    if (beginTime < this._minAuthBegin) {
      throw new AuthError(403, 'signed out during authenticating');
    }

    const refinement = await provider.refineAuth(payload.data);
    if (!refinement) {
      throw new AuthError(400, 'invalid auth info');
    }
    const context = makeContext(payload, refinement);

    // Block any other auth() call begun before this time from updating auth
    this._minAuthBegin = beginTime;
    this._setAuth(token, payload, context);
    return context;
  }

  /**
   * Get a token for authorization usage. To authorize a HTTP request, put the
   * token within "Authorization" header as the format of `Bearer ${token}`.
   * The controller would automatically refresh the token, so make sure
   * retrieving new token every time you make a request, you don't need to store
   * the token by yourself.
   */
  getToken() {
    return this._authed ? this._authed.token : undefined;
  }

  /**
   * Sign out user.
   */
  signOut() {
    if (this._authed) {
      const { scope } = this._authed.payload;
      deleteCookie(TOKEN_COOKIE_KEY, scope.domain, scope.path);
      this._authed = null;
    }
    this._clearTimeouts();
    // Make sure auth operation executing now will not update auth
    this._minAuthBegin = Date.now();
  }

  async _initProvider(platfrom: void | string) {
    const provider = this._getProviderAssertedly(platfrom);
    this._platform = provider.platform;
    this._initedFlag = false;

    // not reinitiate provider of the same platform again
    if (!this._initedPlatforms.has(provider.platform)) {
      this._initedPlatforms.add(provider.platform);

      this.signOut();
      const platformAuthEntry = this._getAuthEntry(provider.platform);

      if (this._initialError) {
        await provider.init(platformAuthEntry, null, this._initialError);
      } else if (this._initialAuth) {
        await provider.init(
          platformAuthEntry,
          this._initialAuth.payload.data,
          null
        );
      } else {
        await provider.init(platformAuthEntry, null, null);
      }
    }

    // set as initiated if platform is not changed by another call
    if (this._platform === provider.platform) {
      this._initedFlag = true;
      this.emit('initiate');
    }
  }

  async _signToken(provider: ClientAuthorizer<any, any>): Promise<string> {
    const { platform } = provider;
    const result = await provider.fetchCredential(this._getAuthEntry(platform));

    if (!result.success) {
      const { code, reason } = result;
      throw new AuthError(code, reason);
    }

    const { token } = await this._fetchAuthPrivateAPI('_sign', {
      platform,
      credential: result.credential,
    });

    return token;
  }

  _setAuth(
    token: string,
    payload: AuthTokenPayload<any>,
    context: AuthInfo<any>
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

  async _refreshAuth(token: string, { refreshLimit }: AuthTokenPayload<any>) {
    const provider = this._getProviderAssertedly(this._platform);
    const beginTime = Date.now();

    let newToken;
    if (refreshLimit && Date.now() < refreshLimit * 1000) {
      // refresh if token is refreshable
      ({ token: newToken } = await this._fetchAuthPrivateAPI('_refresh', {
        token,
      }));
    } else if (provider.shouldResign) {
      // otherwise resign
      newToken = await this._signToken(provider);
    } else {
      return;
    }

    if (
      this._authed
        ? // give up if auth updated during refreshment
          this._authed.token !== token
        : // if signed out during refreshment
          beginTime < this._minAuthBegin
    ) {
      return;
    }

    const payload = getAuthPayload(newToken);
    const refinement = await provider.refineAuth(payload.data);
    if (!refinement) {
      throw new AuthError(400, 'invalid auth info');
    }

    const context = makeContext(payload, refinement);
    this._setAuth(newToken, payload, context);
    this.emit('refresh', context);
  }

  _refreshAuthCallback = (token: string, payload: AuthTokenPayload<any>) => {
    this._refreshTimeoutId = null;

    this._refreshAuth(token, payload).catch(err => {
      this.emit('error', err);
    });
  };

  _expireTokenCallback = (token: string) => {
    this._expireTimeoutId = null;

    let authed;
    if ((authed = this._authed) && authed.token === token) {
      this._authed = null;
      this.emit('expire', authed.context);
    }
  };

  _getProviderAssertedly(platform: void | string): ClientAuthorizer<any, any> {
    if (!platform) {
      throw new AuthError(400, 'no platform specified');
    }
    const provider = this.providers.find(p => p.platform === platform);
    if (!provider) {
      throw new AuthError(400, `unknown platform "${platform}"`);
    }
    return provider;
  }

  _getAuthEntry(route: string) {
    const rootURL = this._authURL;
    const componentURL = new URL(
      rootURL.pathname.replace(/\/?$/, `/${route}`),
      rootURL
    );
    return componentURL.href;
  }

  async _fetchAuthPrivateAPI(
    api: string,
    body: SignRequestBody<any> | RefreshRequestBody | VerifyRequestBody
  ): Promise<AuthAPIResponseBody> {
    const res = await fetch(this._getAuthEntry(api), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const {
        error: { code, reason },
      }: AuthAPIResponseErrorBody = await res.json();
      throw new AuthError(code, reason);
    }

    const result = await res.json();
    return result;
  }

  _clearTimeouts() {
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
