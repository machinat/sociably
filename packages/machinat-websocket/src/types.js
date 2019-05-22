// @flow
import type { IncomingMessage } from 'http';
import type { MachinatEvent, MachinatTransport } from 'machinat-base/types';
import type MachinatSocket, { EventBody, RegisterBody } from './socket';
import type WebSocketChannel from './channel';

export type SocketId = string;
export type ChannelUid = string;

export type ConnectionInfo = {| [string]: any |};

export type WebSocketEvent = {
  platform: 'websocket',
  type: string,
  subtype?: string,
  payload: any,
};

declare var e: WebSocketEvent;
(e: MachinatEvent<any>);

export type WebEventJob = {
  body: EventBody,
  whitelist?: string[],
  blacklist?: string[],
};

export type RequestInfo = {
  method: string,
  url: string,
  headers: {| [string]: string |},
};

export type WebSocketTransport = {
  source: 'websocket',
  socketId: SocketId,
  request: RequestInfo,
  connectionInfo?: ConnectionInfo,
};

declare var t: WebSocketTransport;
(t: MachinatTransport<'websocket'>);

export type AcceptedRegisterResponse = {
  accepted: true,
  channel: WebSocketChannel,
  info: ConnectionInfo,
};

export type UnacceptedRegisterResponse = {|
  accepted: false,
  code: number,
  reason: string,
|};

export type RegisterResponse =
  | AcceptedRegisterResponse
  | UnacceptedRegisterResponse;

export type WebSocketResponse = void | RegisterResponse;

export type RegisterAuthenticator = (
  socket: MachinatSocket,
  body: RegisterBody
) => Promise<RegisterResponse>;

export type WebSocketBotOptions = {|
  verifyUpgrade?: IncomingMessage => boolean,
|};

export interface SocketBroker {
  broadcast(job: WebEventJob): Promise<null | SocketId[]>;
  addConnection(
    uid: ChannelUid,
    socketId: SocketId,
    info: ConnectionInfo
  ): Promise<boolean>;
  removeConnection(uid: ChannelUid, socketId: SocketId): Promise<boolean>;
}
