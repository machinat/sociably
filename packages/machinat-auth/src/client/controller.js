// @flow
import EventEmitter from 'events';
import invariant from 'invariant';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { decode as decodeJWT } from 'jsonwebtoken';
import { TOKEN_CONTENT_COOKIE_KEY, ERROR_COOKIE_KEY } from '../constant';
import AuthError from '../error';
import type {
  AuthContext,
  ClientAuthProvider,
  AuthTokenPayload,
  ErrorTokenPayload,
  SignRequestBody,
  RefreshRequestBody,
  VerifyRequestBody,
  AuthAPIResponseBody,
  AuthAPIResponseErrorBody,
} from '../types';

type ClientFlowControllerOpts = {|
  authEntry?: string,
  providers: ClientAuthProvider<any, any>[],
  refreshLeadTime?: number,
|};

declare var location: Location;
declare var document: Document;
declare var fetch: (url: string, options: Object) => Object;

const deleteCookie = (name: string, domain?: string, path?: string) => {
  document.cookie = serializeCookie(name, '', {
    expires: new Date(0),
    domain,
    path,
  });
};

const getAuthPayload = (token: string): AuthTokenPayload<any> =>
  decodeJWT(`${token}.`);

const refineAuthContext = async (
  provider: ClientAuthProvider<any, any>,
  { exp, iat, auth }: AuthTokenPayload<any>
): Promise<AuthContext<any>> => {
  const refinement = await provider.refineAuth(auth);
  if (!refinement) {
    throw new AuthError(400, 'invalid auth info');
  }

  const { channel, user } = refinement;
  return {
    platform: provider.platform,
    loginAt: new Date(iat * 1000),
    expireAt: new Date(exp * 1000),
    channel,
    user,
    data: auth,
  };
};

class ClientFlowController extends EventEmitter {
  providers: ClientAuthProvider<any, any>[];
  refreshLeadTime: number;

  _platform: void | string;
  _token: void | string;
  _authURL: URL;

  _initiated: boolean;
  _initPromise: null | Promise<void>;
  _minAuthBegin: number;

  _initialError: null | Error;
  _initialAuth: null | {| token: string, payload: AuthTokenPayload<any> |};

  _refreshTimeoutId: null | TimeoutID;
  _expireTimeoutId: null | TimeoutID;

  get platform() {
    return this.platform;
  }

  get isInitiated() {
    return this._initiated;
  }

  get isInitiating() {
    return !!this._initPromise;
  }

  get isAuthenticated() {
    return !!this._token;
  }

  constructor({
    providers,
    refreshLeadTime = 300, // 5 min
    authEntry = '/auth',
  }: ClientFlowControllerOpts = {}) {
    invariant(
      providers && providers.length > 0,
      'options.providers must not be empty'
    );
    super();

    this.providers = providers;
    this.refreshLeadTime = refreshLeadTime;
    this._authURL = new URL(authEntry, location.href);

    this._initiated = false;
    this._initPromise = null;
    this._minAuthBegin = -1;

    this._initialError = null;
    this._initialAuth = null;

    this._platform = undefined;
    this._token = undefined;

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
    if (this._initiated && platformInput === this._platform) {
      // Do not reinitiate provider of the same platform again
      return;
    }

    // Reset auth for reinitiating as different platform
    this._initiated = false;
    this.signOut();

    const cookies = parseCookie(document.cookie);
    if (cookies[ERROR_COOKIE_KEY]) {
      // Error happen in backend flow
      const {
        platform: errorPlatform,
        error: { code, message },
        scope: { domain, path },
      }: ErrorTokenPayload = decodeJWT(cookies[ERROR_COOKIE_KEY]);
      deleteCookie(ERROR_COOKIE_KEY, domain, path);

      this._platform = errorPlatform;
      this._initialError = new AuthError(code, message);
    } else if (cookies[TOKEN_CONTENT_COOKIE_KEY]) {
      // Auth completed in backend flow
      const token = cookies[TOKEN_CONTENT_COOKIE_KEY];
      const payload = getAuthPayload(token);

      this._platform = payload.platform;
      this._initialAuth = { token, payload };
    }

    const platformSpecified =
      platformInput || new URLSearchParams(location.search).get('platform');

    if (platformSpecified && platformSpecified !== this._platform) {
      // Ignore data in cookie if different platform specified in query
      this._platform = platformSpecified;
      this._token = undefined;
      this._initialAuth = null;
      this._initialError = null;
    }

    // Execute init work of platform, promise would be awaited within auth()
    this._initPromise = this._initProvider()
      .catch(err => {
        this.emit('error', err);
      })
      .finally(() => {
        this._initPromise = null;
      });
  }

  /**
   * Execute the auth flow immediatly. If user is already signed in, it would
   * update auth after succeeded but remain the original auth status when fail.
   * It resolves an AuthContext object, but if any signOut() or another auth()
   * call change the auth status during operation, a null instead.
   */
  async auth(): Promise<null | AuthContext<any>> {
    if (this._initPromise) {
      // Wait for initiation for the first time
      await this._initPromise;
    } else if (!this._initiated) {
      throw new AuthError(400, 'controller not initiated');
    }

    if (this._initialError) {
      // Throw if error happen in backend flow
      const err = this._initialError;
      this._initialError = null;
      throw err;
    }

    const begin = Date.now();
    const provider = this._getProviderDangerously();

    let token;
    let payload;
    if (this._initialAuth) {
      // auth already completed in backend flow
      ({ token, payload } = this._initialAuth);
      this._initialAuth = null;
    } else {
      token = await this._signToken(provider);
      payload = getAuthPayload(token);
    }

    // Update auth only when no signOut() call or another succeeded auth() call
    // have happened during the operation time
    if (begin < this._minAuthBegin) {
      return null;
    }

    // Block any other auth() call begun before this time from updating auth
    this._minAuthBegin = begin;
    this._setAuth(token, payload);

    const context = await refineAuthContext(provider, payload);
    return context;
  }

  /**
   * Get a token for authorization usage. To authorize a HTTP request, put the
   * token within "Authorization" header as the format of `Bearer ${token}`.
   * The controller would automatically refresh the token, so make sure
   * retrieving new token every time you make a request and don't need to store
   * the token by yourself.
   */
  getToken() {
    if (!this._token) {
      throw new AuthError(401, 'not authencated');
    }
    return this._token;
  }

  /**
   * Sign user out and also disable all the auth operation currently executing.
   */
  signOut() {
    this._token = undefined;
    this._clearTimeouts();
    // Make sure auth operation executing now will not update auth
    this._minAuthBegin = Date.now();
  }

  async _initProvider() {
    const provider = this._getProviderDangerously();
    const platformAuthEntry = this._getAuthEntry(provider.platform);

    if (this._initialError) {
      await provider.init(platformAuthEntry, null, this._initialError);
    } else if (this._initialAuth) {
      await provider.init(
        platformAuthEntry,
        this._initialAuth.payload.auth,
        null
      );
    } else {
      await provider.init(platformAuthEntry, null, null);
    }

    if (provider.platform === this._platform) {
      // Label as initiated if platform target not change by another init()
      this._initiated = true;
    }
  }

  async _signToken(provider: ClientAuthProvider<any, any>): Promise<string> {
    const { platform } = provider;
    const result = await provider.startAuthFlow(this._getAuthEntry(platform));

    if (!result.accepted) {
      const { code, message } = result;
      throw new AuthError(code, message);
    }

    const { token } = await this._fetchAuthPrivateAPI('_sign', {
      platform,
      credential: result.credential,
    });

    return token;
  }

  _setAuth(token: string, payload: AuthTokenPayload<any>) {
    this._token = token;
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
    const provider = this._getProviderDangerously();

    let newToken;
    if (refreshLimit && Date.now() < refreshLimit * 1000) {
      // refresh if token is refreshable
      ({ token: newToken } = await this._fetchAuthPrivateAPI('_refresh', {
        token,
      }));
    } else {
      // otherwise resign
      newToken = await this._signToken(provider);
    }

    if (this._token !== token) {
      // give up if token updated during refreshment
      return;
    }

    const payload = getAuthPayload(newToken);
    this._setAuth(token, payload);

    const context = await refineAuthContext(provider, payload);
    this.emit('refreshed', context);
  }

  _refreshAuthCallback = (token: string, payload: AuthTokenPayload<any>) => {
    this._refreshTimeoutId = null;

    this._refreshAuth(token, payload).catch(err => {
      this.emit('error', err);
    });
  };

  _expireTokenCallback = (token: string) => {
    if (this._token === token) {
      this._expireTimeoutId = null;
      this._token = undefined;

      this.emit('expired');
    }
  };

  _getProviderOf(platform: string) {
    const provider = this.providers.find(p => p.platform === platform);
    return provider || null;
  }

  _getProviderDangerously() {
    const platform = this._platform;
    if (!platform) {
      throw new AuthError(400, 'no platform specified');
    }
    const provider = this._getProviderOf(platform);
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
    const res = await fetch(this._getAuthEntry(api), body);

    if (!res.ok) {
      const {
        error: { code, message },
      }: AuthAPIResponseErrorBody = await res.json();
      throw new AuthError(code, message);
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

export default ClientFlowController;
