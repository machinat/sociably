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
import type {
  TopicScopeChannel,
  UserScopeChannel,
  ConnectionChannel,
} from './channel';

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

export type WebSocketChannel =
  | TopicScopeChannel
  | UserScopeChannel
  | ConnectionChannel;

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

export type AuthContext = {
  type: string,
  [string]: any,
};

export type WebSocketMetadata = {|
  source: 'websocket',
  request: RequestInfo,
  connection: Connection,
  authContext: AuthContext,
|};

declare var t: WebSocketMetadata;
(t: MachinatMetadata<'websocket'>);

type AcceptedAuthenticateResult = {|
  accepted: true,
  user: null | MachinatUser,
  context: AuthContext,
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

type RegisterData = {|
  type: string,
  auth: Object,
|};

export type ServerAuthenticatorFunc = (
  request: RequestInfo,
  data: RegisterData
) => Promise<AuthenticateResult>;

export type WebSocketComponent = MachinatNativeComponent<EventOrder>;

export type WebSocketBotOptions = {|
  verifyUpgrade?: RequestInfo => boolean,
  authenticator?: ServerAuthenticatorFunc,
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
  serverId: string,
  connectionId: string,
};

type TopicTarget = {
  type: 'topic',
  uid: ChannelUid,
};

export type RemoteTarget = ConnectionTarget | TopicTarget;

export interface SocketBroker {
  sendRemote(
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

export type ClientRegistratorFunc = () => Promise<{
  registerData: RegisterData,
  user: null | MachinatUser,
}>;
