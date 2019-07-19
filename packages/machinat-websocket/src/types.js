// @flow
import type { MachinatNativeComponent } from 'machinat/types';
import type {
  MachinatEvent,
  MachinatMetadata,
  BotPlugin,
} from 'machinat-base/types';
import type WebSocketBot from './bot';
import type MachinatSocket, { RegisterBody } from './socket';
import type WebSocketChannel from './channel';

export type SocketId = string;
export type ChannelUid = string;

export type ConnectionInfo = { [string]: any };

export type WebSocketEvent = {
  platform: 'websocket',
  type: string,
  subtype?: string,
  payload: any,
};

declare var e: WebSocketEvent;
(e: MachinatEvent<any>);

export type EventRenderValue = {|
  type: string,
  subtype?: string,
  payload?: string,
  whitelist?: string[],
  blacklist?: string[],
|};

export type WebSocketJob = {|
  uid: ChannelUid,
  ...EventRenderValue,
|};

export type WebSocketResult = {
  sockets: null | SocketId[],
};

export type RequestInfo = {|
  method: string,
  url: string,
  headers: {| [string]: string |},
  encrypted: boolean,
|};

export type WebSocketMetadata = {|
  source: 'websocket',
  socketId: SocketId,
  request: RequestInfo,
  connectionInfo?: ConnectionInfo,
|};

declare var t: WebSocketMetadata;
(t: MachinatMetadata<'websocket'>);

export type AcceptedRegisterResponse = {|
  accepted: true,
  channel: WebSocketChannel,
  info: ConnectionInfo,
|};

export type UnacceptedRegisterResponse = {|
  accepted: false,
  // TODO: reject code
  // code: number,
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

export type WebSocketComponent = MachinatNativeComponent<EventRenderValue>;

export type WebSocketBotOptions = {|
  verifyUpgrade?: RequestInfo => boolean,
  plugins?: BotPlugin<
    WebSocketChannel,
    WebSocketEvent,
    WebSocketMetadata,
    WebSocketResponse,
    EventRenderValue,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult,
    void,
    WebSocketBot
  >[],
|};

export interface SocketBroker {
  broadcastRemote(job: WebSocketJob): Promise<null | SocketId[]>;

  connectRemoteSocket(
    uid: ChannelUid,
    socketId: SocketId,
    info: ConnectionInfo
  ): Promise<boolean>;

  disconnectRemoteSocket(
    uid: ChannelUid,
    socketId: SocketId,
    reason: string
  ): Promise<boolean>;

  updateConnected(
    uid: ChannelUid,
    socketId: SocketId,
    info: ConnectionInfo
  ): Promise<boolean>;

  updateDisconnected(uid: ChannelUid, socketId: SocketId): Promise<boolean>;

  getRemoteConnections(
    uid: ChannelUid
  ): Promise<null | { socketId: SocketId, info: ConnectionInfo }[]>;
}
