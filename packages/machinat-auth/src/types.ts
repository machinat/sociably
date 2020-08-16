import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import type { IncomingMessage, ServerResponse } from 'http';
import type { CookieAccessor } from './server/cookie';

type TokenBase = {
  iat: number;
  exp: number;
};

export type AuthPayload<AuthData> = {
  platform: string;
  data: AuthData;
  refreshLimit?: number;
  scope: { domain?: string; path: string };
};

export type AuthTokenPayload<AuthData> = TokenBase & AuthPayload<AuthData>;

export type StatePayload<StateData> = {
  platform: string;
  state: StateData;
};

export type StateTokenPayload<StateData> = TokenBase & StatePayload<StateData>;

export type ErrorMessage = { code: number; reason: string };

export type ErrorPayload = {
  platform: string;
  error: ErrorMessage;
  scope: { domain?: string; path: string };
};

export type ErrorTokenPayload = TokenBase & ErrorPayload;

export type AuthContext<AuthData> = {
  platform: string;
  user: MachinatUser;
  channel: null | MachinatChannel;
  loginAt: Date;
  expireAt: Date;
  data: AuthData;
};

export type AuthorizerRefineResult = {
  user: MachinatUser;
  channel: null | MachinatChannel;
};

type ErrorResult = {
  success: false;
  code: number;
  reason: string;
};

type AuthorizerVerifyResult<AuthData> =
  | { success: true; data: AuthData; refreshable: boolean }
  | ErrorResult;

export interface ServerAuthorizer<AuthData, Credential> {
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
    cookieAccessor: CookieAccessor
  ): Promise<void>;

  /**
   * verifyCredential called when sign requests from client side are received,
   * controller would sign in the user by issuing a token to client and signing
   * a signature wihtin cookie if it resolve success.
   */
  verifyCredential(
    credential: Credential
  ): Promise<AuthorizerVerifyResult<AuthData>>;

  /**
   * verifyRefreshment is called when refresh requests from client side are
   * received, controller would refresh token and signature if it resolve
   * success.
   */
  verifyRefreshment(data: AuthData): Promise<AuthorizerVerifyResult<AuthData>>;

  /**
   * refineAuthr efine the auth data to auth context members which fit the
   * machinat interfaces, the context would then be passed to the appliction.
   */
  refineAuth(data: AuthData): Promise<null | AuthorizerRefineResult>;
}

type AuthorizerCredentialResult<Credential> =
  | { success: true; credential: Credential }
  | ErrorResult;

export interface ClientAuthorizer<AuthData, Credential> {
  platform: string;
  shouldResign: boolean;

  /**
   * Initiate necessary libary like IdP SDK to start authentication works, this
   * method is expected to be called before the view of app start rendering and
   * would only be called once.
   */
  init(
    authEntry: string,
    authFromServer: null | AuthData,
    errorFromServer: null | ErrorMessage
  ): Promise<void>;

  /**
   * Start work flow from client side and resolve the auth data which would be
   * then verified and signed at server side. If the auth flow reuqire
   * redirecting user-agent, just set the location and pend resolving.
   */
  fetchCredential(
    serverEntry: string
  ): Promise<AuthorizerCredentialResult<Credential>>;

  /**
   * Refine the auth data into auth context members fit the machinat interfaces,
   * the context would then be passed to the appliction.
   */
  refineAuth(data: AuthData): Promise<null | AuthorizerRefineResult>;
}

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

export type AuthAPIResponseBody = {
  platform: string;
  token: string;
};

export type AuthAPIErrorBody = {
  error: ErrorMessage;
};

export type AuthModuleConfigs = {
  secret: string;
  entryPath?: string;
  tokenAge?: number;
  authCookieAge?: number;
  dataCookieAge?: number;
  refreshPeriod?: number;
  cookieDomain?: string;
  cookiePath?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
};
