// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatUser, MachinatChannel } from 'machinat/types';
import type AuthFlowHelper from './server/helper';

export type AuthData<Data> = {|
  data: Data,
|};

export type StateData<Data> = {|
  redirectTarget: void | string,
  data: Data,
|};

export type ErrorData = {
  code: number,
  message: string,
};

type Payload<T> = {
  platform: string,
  iat: number,
  exp: number,
  scope: { domain?: string, path: string },
} & T;
export type AuthPayload<Data> = Payload<{ auth: AuthData<Data> }>;
export type StatePayload<Data> = Payload<{ state: StateData<Data> }>;
export type ErrorPayload = Payload<{ error: ErrorData }>;

export type AuthResult<Data> = {|
  user: MachinatUser,
  channel: null | MachinatChannel,
  loginAt: null | Date,
  data: Data,
|};

export type AuthContext<Data> = {|
  platform: string,
  selfIssued: boolean,
  ...AuthResult<Data>,
|};

/**
 *
 *
 */
export interface ServerAuthProvider<Data> {
  platform: string;
  handleAuthRequest(
    req: IncomingMessage,
    res: ServerResponse,
    helper: AuthFlowHelper
  ): Promise<void>;
  verifyAuthData(data: AuthData<Data>): Promise<AuthResult<Data>>;
  refineAuthData(data: AuthData<Data>): Promise<null | AuthResult<Data>>;
}

export interface ClientAuthProvider<Data> {
  platform: string;
  init(): void;
  startAuthFlow({ authEntry: string }): Promise<AuthResult<Data>>;
  refineAuthData(data: AuthData<Data>): Promise<null | AuthResult<Data>>;
}

export interface MahcinatAuthError {
  message: string;
  code: number;
}
