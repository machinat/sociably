// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatUser, MachinatChannel } from 'machinat/types';
import type AuthFlowHelper from './server/helper';

export type AuthContext = {
  platform: string,
  user: MachinatUser,
  channel: null | MachinatChannel,
  loginAt: Date,
  info: any,
};

export type AuthData = {|
  data: Object,
|};

export type StateData = {|
  redirectTarget: void | string,
  data: Object,
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
export type AuthPayload = Payload<{ auth: AuthData }>;
export type StatePayload = Payload<{ state: StateData }>;
export type ErrorPayload = Payload<{ error: ErrorData }>;

export interface ServerAuthProvider {
  platform: string;
  handleAuthRequest(
    req: IncomingMessage,
    res: ServerResponse,
    accessor: AuthFlowHelper
  ): Promise<void>;
  verifyAuthData(data: AuthData): Promise<boolean>;
  unmarshalAuthData(data: Object): null | AuthContext;
}

export interface ClientAuthProvider {
  platform: string;
  init(): void;
  startFlow(authEntry: string): Promise<AuthData>;
  unmarshalAuthData(data: Object): AuthContext;
}
