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

export type WebSocketMetadata<AuthContext> = {|
  source: 'websocket',
  request: RequestInfo,
  connection: Connection,
  authContext: AuthContext,
|};

declare var m: WebSocketMetadata<any>;
(m: MachinatMetadata<'websocket'>);

type AcceptedAuthenticateResult<AuthContext> = {|
  accepted: true,
  user: null | MachinatUser,
  expireAt: null | Date,
  context: AuthContext,
|};

type UnacceptedAuthenticateResult = {|
  accepted: false,
  // TODO: reject code
  // code: number,
  reason: string,
|};

export type AuthenticateResult<AuthCtx> =
  | AcceptedAuthenticateResult<AuthCtx>
  | UnacceptedAuthenticateResult;

export type ServerAuthenticatorFunc<AuthCtx, RegData> = (
  request: RequestInfo,
  data: RegData
) => Promise<AuthenticateResult<AuthCtx>>;

export type WebSocketComponent = MachinatNativeComponent<EventOrder>;

export type WebSocketBotOptions<AuthCtx, RegData> = {|
  authenticator: ServerAuthenticatorFunc<AuthCtx, RegData>,
  verifyUpgrade?: RequestInfo => boolean,
  plugins?: BotPlugin<
    WebSocketChannel,
    ?MachinatUser,
    WebSocketEvent,
    WebSocketMetadata<AuthCtx>,
    void,
    EventOrder,
    WebSocketComponent,
    WebSocketJob,
    WebSocketResult,
    void,
    WebSocketBot<AuthCtx, RegData>
  >[],
|};

type ConnectionTarget = {|
  type: 'connection',
  serverId: string,
  connId: string,
|};

type TopicTarget = {|
  type: 'topic',
  uid: ChannelUid,
|};

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

export type ClientRegistratorFunc<RegisterData> = () => Promise<{
  user: null | MachinatUser,
  data: RegisterData,
}>;
