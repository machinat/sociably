// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import type { CookieAccessor } from './server/cookie';

type TokenBase = {|
  iat: number,
  exp: number,
|};

export type AuthPayload<AuthData> = {|
  platform: string,
  data: AuthData,
  refreshLimit?: number,
  scope: { domain?: string, path: string },
|};

export type AuthTokenPayload<AuthData> = {|
  ...TokenBase,
  ...AuthPayload<AuthData>,
|};

export type StatePayload<StateData> = {|
  platform: string,
  state: StateData,
|};

export type StateTokenPayload<StateData> = {|
  ...TokenBase,
  ...StatePayload<StateData>,
|};

export type ErrorPayload = {|
  platform: string,
  error: {| code: number, reason: string |},
  scope: { domain?: string, path: string },
|};

export type ErrorTokenPayload = {|
  ...TokenBase,
  ...ErrorPayload,
|};

export type AuthInfo<AuthData> = {|
  platform: string,
  user: MachinatUser,
  authorizedChannel: null | MachinatChannel,
  loginAt: Date,
  expireAt: Date,
  data: AuthData,
|};

export type AuthRefineResult = {|
  user: MachinatUser,
  authorizedChannel: null | MachinatChannel,
|};

export type SuccessVerifyResult<AuthData> = {|
  success: true,
  data: AuthData,
  refreshable: boolean,
|};

export type ErrorResult = {|
  success: false,
  code: number,
  reason: string,
|};

export type VerifyResult<AuthData> =
  | SuccessVerifyResult<AuthData>
  | ErrorResult;

export interface ServerAuthorizer<Data, Credential> {
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
  verifyCredential(credential: Credential): Promise<VerifyResult<Data>>;

  /**
   * verifyRefreshment is called when refresh requests from client side are
   * received, controller would refresh token and signature if it resolve
   * success.
   */
  verifyRefreshment(data: Data): Promise<VerifyResult<Data>>;

  /**
   * refineAuthr efine the auth data to auth context members which fit the
   * machinat interfaces, the context would then be passed to the appliction.
   */
  refineAuth(data: Data): Promise<null | AuthRefineResult>;
}

export type SuccessCredentialResult<Credential> = {|
  success: true,
  credential: Credential,
|};

export type CredentialResult<Credential> =
  | SuccessCredentialResult<Credential>
  | ErrorResult;

export interface ClientAuthorizer<Data, Credential> {
  platform: string;
  shouldResign: boolean;

  /**
   * Initiate necessary libary like IdP SDK to start authentication works, this
   * method is expected to be called before the view of app start rendering and
   * would only be called once.
   */
  init(
    authEntry: string,
    auth: null | Data,
    error: null | Error
  ): Promise<void>;

  /**
   * Start work flow from client side and resolve the auth data which would be
   * then verified and signed at server side. If the auth flow reuqire
   * redirecting user-agent, just set the location and pend resolving.
   */
  fetchCredential(authEntry: string): Promise<CredentialResult<Credential>>;

  /**
   * Refine the auth data into auth context members fit the machinat interfaces,
   * the context would then be passed to the appliction.
   */
  refineAuth(data: Data): Promise<null | AuthRefineResult>;
}

export type SignRequestBody<Credential> = {|
  platform: string,
  credential: Credential,
|};

export type RefreshRequestBody = {|
  token: string,
|};

export type VerifyRequestBody = {|
  token: string,
|};

export type AuthAPIResponseBody = {|
  platform: string,
  token: string,
|};

export type AuthAPIResponseErrorBody = {|
  error: {
    code: number,
    reason: string,
  },
|};

export type VerifiableRequest = {
  headers: {| [string]: string |},
};

export type AuthModuleConfigs = {|
  secret: string,
  entryPath?: string,
  tokenAge?: number,
  authCookieAge?: number,
  dataCookieAge?: number,
  refreshPeriod?: number,
  cookieDomain?: string,
  cookiePath?: string,
  sameSite?: 'Strict' | 'Lax' | 'None',
  secure?: boolean,
|};
