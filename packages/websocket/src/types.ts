import type {
  NativeComponent,
  MachinatNode,
  MachinatUser,
  PlatformUtilities,
  EventMiddleware,
  DispatchMiddleware,
} from '@machinat/core';
import type { DispatchFrame, DispatchResponse } from '@machinat/core/engine';
import type { MaybeContainer } from '@machinat/core/service';
import type { UnitSegment } from '@machinat/core/renderer';
import type { HttpRequestInfo } from '@machinat/http';
import type { WebSocketBot } from './bot';
import type {
  WebSocketTopicChannel,
  WebSocketUserChannel,
  WebSocketConnection,
} from './channel';

export type { Server as WsServer } from 'ws';
export type { HttpRequestInfo } from '@machinat/http';

export type ConnIdentifier = {
  serverId: string;
  id: string;
};

export type UpgradeRequestInfo = Omit<HttpRequestInfo, 'body'>;

export type EventValue<
  Category extends string = string,
  Type extends string = string,
  Payload = any
> = {
  category: Category;
  type: Type;
  payload: Payload;
};

export type ConnectEventValue = EventValue<'connection', 'connect', null>;

export type DisconnectEventValue = EventValue<
  'connection',
  'disconnect',
  { reason: string | undefined }
>;

export type WebSocketEvent<
  Value extends EventValue,
  User extends null | MachinatUser
> = {
  platform: 'websokcet';
  category: Value['category'];
  type: Value['type'];
  payload: Value['payload'];
  channel: WebSocketConnection;
  user: User;
};

export type EventInput = {
  category?: string;
  type: string;
  payload?: unknown;
};

export interface ConnectionTarget {
  type: 'connection';
  serverId: string;
  id: string;
}

export interface TopicTarget {
  type: 'topic';
  name: string;
}

export interface UserTarget {
  type: 'user';
  userUid: string;
}

export type DispatchTarget = ConnectionTarget | TopicTarget | UserTarget;

export type WebSocketJob = {
  target: DispatchTarget;
  values: EventInput[];
};

export type WebSocketResult = {
  connections: ConnIdentifier[];
};

export type WebSocketDispatchChannel =
  | WebSocketConnection
  | WebSocketUserChannel
  | WebSocketTopicChannel;

export type WebSocketDispatchFrame = DispatchFrame<
  WebSocketDispatchChannel,
  WebSocketJob
>;

export type WebSocketMetadata<AuthContext> = {
  source: 'websocket';
  request: UpgradeRequestInfo;
  connection: WebSocketConnection;
  auth: AuthContext;
};

export type WebSocketComponent = NativeComponent<
  unknown,
  UnitSegment<EventInput>
>;

export type WebSocketDispatchResponse = DispatchResponse<
  WebSocketJob,
  WebSocketResult
>;

export type WebSocketEventContext<
  User extends null | MachinatUser,
  AuthContext,
  Value extends EventValue = EventValue
> = {
  platform: 'websocket';
  event: WebSocketEvent<Value, User>;
  metadata: WebSocketMetadata<AuthContext>;
  bot: WebSocketBot;
  reply(message: MachinatNode): Promise<null | WebSocketDispatchResponse>;
};

type SuccessVerifyLoginResult<User extends null | MachinatUser, AuthContext> = {
  success: true;
  user: User;
  authContext: AuthContext;
  expireAt?: Date;
};

type FailedVerifyLoginResult = {
  success: false;
  code: number;
  reason: string;
};

export type VerifyLoginFn<
  User extends null | MachinatUser,
  AuthContext,
  Credential
> = (
  request: UpgradeRequestInfo,
  credential: Credential
) => Promise<
  SuccessVerifyLoginResult<User, AuthContext> | FailedVerifyLoginResult
>;

export type AnyVerifyLoginFn = VerifyLoginFn<any, unknown, unknown>;

export type VerifyUpgradeFn = (
  request: UpgradeRequestInfo
) => boolean | Promise<boolean>;

export type ClientLoginFn<
  User extends null | MachinatUser,
  Credential
> = () => Promise<{
  user: User;
  credential: Credential;
}>;

export type WebSocketEventMiddleware<
  User extends null | MachinatUser,
  Auth
> = EventMiddleware<WebSocketEventContext<User, Auth>, null>;

export type WebSocketDispatchMiddleware = DispatchMiddleware<
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult
>;

export type WebSocketConfigs<
  User extends null | MachinatUser = null,
  Auth = null
> = {
  entryPath?: string;
  heartbeatInterval?: number;
  eventMiddlewares?: MaybeContainer<WebSocketEventMiddleware<User, Auth>>[];
  dispatchMiddlewares?: MaybeContainer<WebSocketDispatchMiddleware>[];
};

export type WebSocketPlatformUtilities<
  User extends null | MachinatUser,
  Auth
> = PlatformUtilities<
  WebSocketEventContext<User, Auth>,
  null,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult
>;

export interface WebSocketClusterBroker {
  start(): Promise<void>;
  stop(): Promise<void>;
  dispatchRemote(job: WebSocketJob): Promise<ConnIdentifier[]>;

  subscribeTopicRemote(conn: ConnIdentifier, topic: string): Promise<boolean>;
  unsubscribeTopicRemote(conn: ConnIdentifier, topic: string): Promise<boolean>;

  disconnectRemote(conn: ConnIdentifier): Promise<boolean>;
  onRemoteEvent(handler: (job: WebSocketJob) => void): void;
}
