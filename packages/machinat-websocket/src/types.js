// @flow
import type { IncomingMessage } from 'http';
import type { MachinatEvent } from 'machinat-base/types';
import type MachinatSocket, { EventBody, RegisterBody } from './socket';
import type WebSocketThread from './thread';

export type SocketId = string;
export type ThreadUid = string;

export type ConnectionInfo = {| [string]: any |};

export type WebSocketEvent = {
  platform: 'websocket',
  type: string,
  subtype?: string,
  payload: any,
  connectionInfo: ConnectionInfo,
  shouldRespond: boolean,
  thread: WebSocketThread,
};

declare var e: WebSocketEvent;
(e: MachinatEvent<any, WebSocketThread>);

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
  connectionInfo: ConnectionInfo,
};

export type AcceptedRegisterResponse = {
  accepted: true,
  thread: WebSocketThread,
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
    uid: ThreadUid,
    socketId: SocketId,
    info: ConnectionInfo
  ): Promise<boolean>;
  removeConnection(uid: ThreadUid, socketId: SocketId): Promise<boolean>;
}
