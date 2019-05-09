// @flow
import type { MachinatEvent } from 'machinat-base/types';
import type { EventBody, RegisterBody } from './channel';
import type WebThread from './thread';

export type ChannelId = string;
export type ThreadUid = string;

export type WebEvent = {
  platform: 'web',
  type: string,
  subtype?: string,
  shouldRespond: boolean,
  thread: WebThread,
  payload: any,
  connectionId: string,
};

declare var e: WebEvent;
(e: MachinatEvent<any, WebThread>);

export type WebEventJob = {
  body: EventBody,
  whitelist?: string[],
  blacklist?: string[],
};

export type RequestInfo = {
  method: string,
  url: string,
  headers: { [string]: string },
  origin: string,
};

export type ConnectionInfo = { [string]: any };

export type WebSocketContext = {
  channelId: ChannelId,
  request: RequestInfo,
  info: ConnectionInfo,
};

export type AcceptedRegisterResult = {
  accepted: true,
  thread: WebThread,
  info: ConnectionInfo,
};

export type UnacceptedRegisterResult = {
  accepted: false,
  code: number,
  reason: string,
};

export type RegisterResult = AcceptedRegisterResult | UnacceptedRegisterResult;

export type RegisterAuthenticator = (
  request: RequestInfo,
  body: RegisterBody
) => RegisterResult;

export type WebBotOptions = {
  verifyUpgrade: boolean,
  handleRegister: () => {},
};

export interface ClusterSynchronizer {
  addNode(): Promise<void>;
  removeNode(): Promise<void>;
  addChannel(): Promise<void>;
  removeChannel(): Promise<void>;
  addConnection(): Promise<void>;
  removeConnection(): Promise<void>;
  send(): Promise<void>;
}
