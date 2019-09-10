// @flow
import type {
  MachinatNativeComponent,
  MachinatEvent,
  MachinatUser,
  MachinatMetadata,
} from 'machinat/types';
import type { BotPlugin } from 'machinat-base/types';
import type WebSocketBot from './bot';
import type MachinatSocket from './socket';
import type { WebSocketChannel } from './channel';

export type SocketId = string;
export type ConnectionId = string;
export type ChannelUid = string;

export type Connection = {
  id: ConnectionId,
  user: ?MachinatUser,
  socket: MachinatSocket,
  channel: WebSocketChannel,
};

export type WebSocketEvent = {
  platform: 'websocket',
  type: string,
  subtype?: string,
  payload: any,
};

declare var e: WebSocketEvent;
(e: MachinatEvent<any>);

export type EventOrder = {|
  type: string,
  subtype?: string,
  payload?: string,
  only?: ConnectionId[],
  except?: ConnectionId[],
|};

export type WebSocketJob = {|
  channel: WebSocketChannel,
  order: EventOrder,
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
|};

declare var t: WebSocketMetadata;
(t: MachinatMetadata<'websocket'>);

export type AcceptedRegisterResponse = {|
  accepted: true,
  user: MachinatUser,
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

export type WebSocketComponent = MachinatNativeComponent<EventOrder>;

export type WebSocketBotOptions = {|
  verifyUpgrade?: RequestInfo => boolean,
  plugins?: BotPlugin<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata,
    WebSocketResponse,
    EventOrder,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult,
    void,
    WebSocketBot
  >[],
|};

type ConnectionTarget = {
  type: 'connection',
  connectionId: ConnectionId,
};

type TopicTarget = {
  type: 'topic',
  channelUid: ChannelUid,
};

export type RemoteTarget = ConnectionTarget | TopicTarget;

export interface SocketBroker {
  broadcastRemote(
    target: RemoteTarget,
    order: EventOrder
  ): Promise<null | ConnectionId[]>;

  attachRemoteConnectionToTopic(
    channel: WebSocketChannel,
    chanUid: ChannelUid
  ): Promise<boolean>;

  detachRemoteConnectionFromTopic(
    channel: WebSocketChannel,
    chanUid: ChannelUid
  ): Promise<boolean>;

  onRemoteEvent(
    handler: (target: RemoteTarget, order: EventOrder) => void
  ): void;
}
