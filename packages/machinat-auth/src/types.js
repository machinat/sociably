// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatUser, MachinatChannel } from 'machinat/types';
import type AuthCookieSession from './server/session';

type TokenBase = {|
  iat: number,
  exp: number,
|};

type PayloadBase = {|
  platform: string,
  scope: { domain?: string, path: string },
|};

export type AuthPayload<AuthData> = {|
  auth: AuthData,
  refreshLimit?: number,
  ...PayloadBase,
|};

export type AuthTokenPayload<AuthData> = {|
  ...TokenBase,
  ...AuthPayload<AuthData>,
|};

export type StatePayload<StateData> = {|
  state: StateData,
  ...PayloadBase,
|};

export type StateTokenPayload<StateData> = {|
  ...TokenBase,
  ...StatePayload<StateData>,
|};

export type ErrorPayload = {|
  error: {| code: number, message: string |},
  ...PayloadBase,
|};

export type ErrorTokenPayload = {|
  ...TokenBase,
  ...ErrorPayload,
|};

export type AuthRefineResult = {|
  user: MachinatUser,
  channel: null | MachinatChannel,
|};

export type AuthContext<AuthData> = {|
  platform: string,
  user: MachinatUser,
  channel: null | MachinatChannel,
  loginAt: Date,
  expireAt: Date,
  data: AuthData,
|};

export type VerifyResult<AuthData> = {|
  accepted: true,
  data: AuthData,
  refreshable: boolean,
|};

export type ErrorResult = {|
  accepted: false,
  code: number,
  message: string,
|};

export interface ServerAuthProvider<AuthData, Credential> {
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
    session: AuthCookieSession
  ): Promise<void>;

  /**
   * This method is called when sign requests from client side are received,
   * controller would sign in the user by issuing a token to client and signing
   * a signature wihtin cookie if it resolve accepted.
   */
  verifySigning(
    credential: Credential
  ): Promise<VerifyResult<AuthData> | ErrorResult>;

  /**
   * This method is called when  refresh requests from client side are received,
   * controller would refresh token and signature if it resolve accepted.
   */
  verifyRefreshment(
    data: AuthData
  ): Promise<VerifyResult<AuthData> | ErrorResult>;

  /**
   * Refine the auth data to auth context members which fit the machinat
   * interfaces, the context would then be passed to the appliction.
   */
  refineAuth(data: AuthData): Promise<null | AuthRefineResult>;
}

export type CredentialResult<Credential> = {|
  accepted: true,
  credential: Credential,
|};

export interface ClientAuthProvider<AuthData, Credential> {
  platform: string;

  /**
   * Initiate necessary libary like IdP SDK to start authentication works, this
   * method is expected to be called before the view of app start rendering and
   * would only be called once.
   */
  init(
    authEntry: string,
    auth: null | AuthData,
    error: null | Error
  ): Promise<void>;

  /**
   * Start work flow from client side and resolve the auth data which would be
   * then verified and signed at server side. If the auth flow reuqire
   * redirecting user-agent, just set the location and pend resolving.
   */
  startAuthFlow(
    authEntry: string
  ): Promise<CredentialResult<Credential> | ErrorResult>;

  /**
   * Refine the auth data into auth context members fit the machinat interfaces,
   * the context would then be passed to the appliction.
   */
  refineAuth(data: AuthData): Promise<null | AuthRefineResult>;
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
    message: string,
  },
|};

export type VerifiableRequest = {
  headers: {| [string]: string |},
};
