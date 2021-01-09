import type {
  NativeComponent,
  MachinatUser,
  PlatformMounter,
  EventMiddleware,
  DispatchMiddleware,
} from '@machinat/core/types';
import type { DispatchFrame } from '@machinat/core/engine/types';
import type { MaybeContainer } from '@machinat/core/service/types';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { HTTPRequestInfo } from '@machinat/http/types';
import type { WebSocketBot } from './bot';
import type {
  WebSocketTopicChannel,
  WebSocketUserChannel,
  WebSocketConnection,
} from './channel';

export type { HTTPRequestInfo } from '@machinat/http/types';

export type ConnIdentifier = {
  serverId: string;
  id: string;
};

export type UpgradeRequestInfo = Omit<HTTPRequestInfo, 'body'>;

export type EventValue<Kind extends string, Type extends string, Payload> = {
  kind: Kind;
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
  Value extends EventValue<string, string, unknown>,
  User extends null | MachinatUser
> = {
  platform: 'websokcet';
  kind: Value['kind'];
  type: Value['type'];
  payload: Value['payload'];
  channel: WebSocketConnection;
  user: User;
};

export type EventInput = {
  kind?: string;
  type: string;
  payload?: unknown;
};

export interface ConnectionTarget {
  type: 'connection';
  serverId: string;
  connectionId: string;
}

export interface TopicTarget {
  type: 'topic';
  name: string;
}

export interface UserTarget {
  type: 'user';
  userUId: string;
}

export type DispatchTarget = ConnectionTarget | TopicTarget | UserTarget;

export type WebSocketJob = {
  target: DispatchTarget;
  events: EventInput[];
};

export type WebSocketResult = {
  connections: null | ConnIdentifier[];
};

export type WebSocketDispatchFrame = DispatchFrame<
  WebSocketTopicChannel | WebSocketUserChannel | WebSocketConnection,
  WebSocketJob,
  WebSocketBot
>;

export type WebSocketMetadata<AuthInfo> = {
  source: 'websocket';
  request: UpgradeRequestInfo;
  connection: WebSocketConnection;
  auth: AuthInfo;
};

export type WebSocketComponent = NativeComponent<
  unknown,
  UnitSegment<EventInput>
>;

export type WebSocketEventContext<
  User extends null | MachinatUser,
  AuthInfo,
  Value extends EventValue<string, string, unknown> =
    | ConnectEventValue
    | DisconnectEventValue
    | EventValue<string, string, unknown>
> = {
  platform: 'websocket';
  event: WebSocketEvent<Value, User>;
  metadata: WebSocketMetadata<AuthInfo>;
  bot: WebSocketBot;
};

type SuccessVerifyLoginResult<User extends null | MachinatUser, AuthInfo> = {
  success: true;
  user: User;
  authInfo: AuthInfo;
  expireAt?: Date;
};

type FailedVerifyLoginResult = {
  success: false;
  code: number;
  reason: string;
};

export type VerifyLoginFn<
  User extends null | MachinatUser,
  AuthInfo,
  Credential
> = (
  request: UpgradeRequestInfo,
  credential: Credential
) => Promise<
  SuccessVerifyLoginResult<User, AuthInfo> | FailedVerifyLoginResult
>;

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

export type WebSocketPlatformConfigs<
  User extends null | MachinatUser = null,
  Auth = null,
  Credential = null
> = {
  entryPath?: string;
  heartbeatInterval?: number;
  eventMiddlewares?: MaybeContainer<WebSocketEventMiddleware<User, Auth>>[];
  dispatchMiddlewares?: MaybeContainer<WebSocketDispatchMiddleware>[];
};

export type WebSocketPlatformMounter<
  User extends null | MachinatUser,
  Auth
> = PlatformMounter<
  WebSocketEventContext<User, Auth>,
  null,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult
>;
