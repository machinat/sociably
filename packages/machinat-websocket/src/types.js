// @flow
import type {
  MachinatNativeComponent,
  MachinatChannel,
  MachinatEvent,
  MachinatUser,
  MachinatMetadata,
} from 'machinat/types';
import type { BotPlugin } from 'machinat-base/types';
import type WebSocketBot from './bot';
import type Connection from './connection';
import type { RegisterBody } from './socket';

export type ConnectionId = string;
export type ChannelUid = string;

export type WebSocketEvent = {
  platform: 'websocket',
  type: string,
  subtype?: string,
  payload: any,
};

declare var e: WebSocketEvent;
(e: MachinatEvent<any>);

export type TopicScope = {
  platform: 'websocket',
  type: 'topic',
  name: string,
  subtype: string,
  id?: string,
  uid: string,
};

export type UserScope = {
  platform: 'websocket',
  type: 'user',
  user: MachinatUser,
  subtype: string,
  id: string,
  uid: string,
};

export type ConnectionScope = {
  platform: 'websocket',
  type: 'connection',
  connection: Connection,
  subtype: string,
  id: string,
  uid: string,
};

export type WebSocketChannel = TopicScope | UserScope | ConnectionScope;

declare var c: WebSocketChannel;
(c: MachinatChannel);

export type EventOrder = {|
  type: string,
  subtype?: string,
  payload?: string,
  only?: ConnectionId[],
  except?: ConnectionId[],
|};

export type WebSocketJob = {|
  scope: WebSocketChannel,
  order: EventOrder,
|};

export type WebSocketResult = {
  connections: null | Connection[],
};

export type RequestInfo = {|
  method: string,
  url: string,
  headers: {| [string]: string |},
  encrypted: boolean,
|};

export type WebSocketMetadata = {|
  source: 'websocket',
  request: RequestInfo,
  connection: null | Connection,
|};

declare var t: WebSocketMetadata;
(t: MachinatMetadata<'websocket'>);

type AcceptedAuthenticateResult = {|
  accepted: true,
  user: null | MachinatUser,
  tags: null | string[],
|};

type UnacceptedAuthenticateResult = {|
  accepted: false,
  // TODO: reject code
  // code: number,
  reason: string,
|};

export type AuthenticateResult =
  | AcceptedAuthenticateResult
  | UnacceptedAuthenticateResult;

export type AuthenticateFunc = (
  body: RegisterBody,
  request: RequestInfo
) => Promise<AuthenticateResult>;

export type ConnectionAuthenticator = (
  pass: AuthenticateFunc
) => AuthenticateFunc;

export type WebSocketComponent = MachinatNativeComponent<EventOrder>;

export type WebSocketBotOptions = {|
  verifyUpgrade?: RequestInfo => boolean,
  authenticators?: ConnectionAuthenticator[],
  plugins?: BotPlugin<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata,
    void,
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
  connection: Connection,
};

type TopicTarget = {
  type: 'topic',
  uid: ChannelUid,
};

export type RemoteTarget = ConnectionTarget | TopicTarget;

export interface SocketBroker {
  broadcastRemote(
    target: RemoteTarget,
    order: EventOrder
  ): Promise<null | Connection[]>;

  attachTopicRemote(
    connection: Connection,
    channel: WebSocketChannel
  ): Promise<boolean>;

  detachTopicRemote(
    connection: Connection,
    channel: WebSocketChannel
  ): Promise<boolean>;

  disconnectRemote(connection: Connection): Promise<boolean>;

  onRemoteEvent(
    handler: (target: RemoteTarget, order: EventOrder) => void
  ): void;
}
