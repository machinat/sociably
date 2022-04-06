import type {
  IncomingMessage,
  ServerResponse,
  IncomingHttpHeaders,
} from 'http';
import type { MachinatUser, MachinatChannel } from '@machinat/core';
import type { RoutingInfo } from '@machinat/http';
import type { CodeMessageComponent } from './basicAuth';
import type AuthError from './error';

type TokenBase = {
  iat: number;
  exp: number;
};

export type AuthPayload<Data> = {
  platform: string;
  data: Data;
  init: number;
  scope: { domain?: string; path: string };
};

export type AuthTokenPayload<Data> = TokenBase & AuthPayload<Data>;

export type StatePayload<State> = {
  platform: string;
  state: State;
};

export type StateTokenPayload<State> = TokenBase & StatePayload<State>;

export type ErrorMessage = { code: number; reason: string };

export type ErrorPayload = {
  platform: string;
  error: ErrorMessage;
  scope: { domain?: string; path: string };
};

export type ErrorTokenPayload = TokenBase & ErrorPayload;

export type AuthContextBase = {
  loginAt: Date;
  expireAt: Date;
};

export type AuthContext<
  User extends MachinatUser,
  Channel extends MachinatChannel
> = {
  platform: string;
  user: User;
  channel: Channel;
} & AuthContextBase;

export type AnyAuthContext = AuthContext<MachinatUser, MachinatChannel>;

export type ContextDetails<Context extends AnyAuthContext> = Omit<
  Context,
  'platform' | 'loginAt' | 'expireAt'
>;

type ErrorResult = {
  ok: false;
  code: number;
  reason: string;
};

export type VerifyResult<Data> = { ok: true; data: Data } | ErrorResult;

export type CheckDataResult<Context extends AnyAuthContext> =
  | { ok: true; contextDetails: ContextDetails<Context> }
  | ErrorResult;

export type DelegateRoutingInfo = Required<RoutingInfo>;

export interface ServerAuthenticator<
  Credential,
  Data,
  Context extends AnyAuthContext
> {
  platform: string;

  /**
   * Handle requests required in the auth flow, for the most of time, it's used
   * for redirecting user-agent from/to other identity provider (IdP). Any
   * request match route "<auth_server_entry>/{platform}/*" would be delegated
   * to this method, and it's responsible to close the the server response.
   */
  delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse,
    routingInfo: DelegateRoutingInfo
  ): Promise<void>;

  /**
   * Called when sign requests from client side are received, controller would
   * sign in the user by issuing a token to client and signing a signature
   * wihtin cookie if it resolve success.
   */
  verifyCredential(credential: Credential): Promise<VerifyResult<Data>>;

  /**
   * Called when refresh requests from client side are received, controller
   * would refresh token and signature if it resolve success.
   */
  verifyRefreshment(data: Data): Promise<VerifyResult<Data>>;

  /**
   * Called before the authorization finish, you can make some simple non-async
   * final checks. Return the auth context supplement if success.
   */
  checkAuthData(data: Data): CheckDataResult<Context>;
}

export type AnyServerAuthenticator = ServerAuthenticator<
  unknown,
  unknown,
  AnyAuthContext
>;

export type AuthenticatorCredentialResult<Credential> =
  | { ok: true; credential: Credential }
  | ErrorResult;

export interface ClientAuthenticator<
  Credential,
  Data,
  Context extends AnyAuthContext
> {
  platform: string;

  /**
   * Initiate necessary libary like IdP SDK to start authentication works, this
   * method is expected to be called before the view of app start rendering and
   * would only be called once.
   */
  init(
    authEntry: string,
    errorFromServer: null | AuthError,
    dataFromServer: null | Data
  ): Promise<void>;

  /**
   * Start work flow from client side and resolve the auth data which would be
   * then verified and signed at server side. If the auth flow reuqire
   * redirecting user-agent, just set the location and pend resolving.
   */
  fetchCredential(
    entry: string
  ): Promise<AuthenticatorCredentialResult<Credential>>;

  /**
   * Called before the authorization finish, you can make some simple non-async
   * final checks. Return the auth context supplement if success.
   */
  checkAuthData(data: Data): CheckDataResult<Context>;
}

export type AnyClientAuthenticator = ClientAuthenticator<
  unknown,
  unknown,
  AnyAuthContext
>;

export type SignRequestBody<Credential> = {
  platform: string;
  credential: Credential;
};

export type RefreshRequestBody = {
  token: string;
};

export type VerifyRequestBody = {
  token: string;
};

export type AuthApiResponseBody = {
  platform: string;
  token: string;
};

export type AuthApiErrorBody = {
  platform: undefined | string;
  error: ErrorMessage;
};

export type AuthConfigs = {
  /** The secret for signing auth token */
  secret: string;
  /** The complete server entry point URL */
  serverUrl: string;
  /** The path to the auth api. Default to `/` */
  apiRoot?: string;
  /** The web page entry point to redirect the authorized users to. Can be absolute or relative to `serverUrl` */
  redirectRoot?: string;
  /** The lifetime of the token in seconds. Default to an hour */
  tokenLifetime?: number;
  /** The duration a token can be refreshed in seconds. Default to Infinity */
  refreshDuration?: number;
  /** The MaxAge of the data cookies in seconds. Default to 5 minute */
  dataCookieMaxAge?: number;
  /** The domain scope of the auth cookies */
  cookieDomain?: string;
  /** The path scope of the auth cookies. Default to '/' */
  cookiePath?: string;
  /** The `SameSite` attribute of the auth cookies. Default to `strict` */
  cookieSameSite?: 'strict' | 'lax' | 'none';
  /** Force using HTTPS if set to `true` */
  secure?: boolean;
  /** Initiate basic auth service */
  basicAuth?: {
    /** The user needs to enter a verify code in `strict` mode. Default to `strict` */
    mode?: 'loose' | 'strict';
    /** The app name to show while login using basic auth flow */
    appName?: string;
    /** The app image to show while login using basic auth flow */
    appIconUrl?: string;
    /** The digits of the verify code number. Default to 6 */
    verifyCodeDigits?: number;
    /** The customized component to render code message */
    codeMessageComponent?: CodeMessageComponent;
    /** Max time to verify login code. Default to 5 */
    maxLoginAttempt?: number;
    /** Login session duration in seconds. Default to 10 min */
    loginDuration?: number;
  };
};

export type WithHeaders = {
  headers: IncomingHttpHeaders;
};

export type ContextOfAuthenticator<
  Authenticator extends AnyServerAuthenticator | AnyClientAuthenticator
> = Authenticator extends ServerAuthenticator<unknown, unknown, infer Context>
  ? Context
  : Authenticator extends ClientAuthenticator<unknown, unknown, infer Context>
  ? Context
  : never;

type UserOfContext<Context extends AnyAuthContext> =
  Context extends AuthContext<infer User, any> ? User : never;

export type UserOfAuthenticator<
  Authenticator extends AnyServerAuthenticator | AnyClientAuthenticator
> = UserOfContext<ContextOfAuthenticator<Authenticator>>;
