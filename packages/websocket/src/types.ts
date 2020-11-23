import type {
  NativeComponent,
  MachinatUser,
  PlatformMounter,
  EventMiddleware,
  DispatchMiddleware,
} from '@machinat/core/types';
import type { DispatchFrame } from '@machinat/core/engine/types';
import type { MaybeContainerOf } from '@machinat/core/service/types';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { HTTPRequestInfo } from '@machinat/http/types';
import type { WebSocketBot } from './bot';
import type { TopicChannel, UserChannel, ConnectionChannel } from './channel';

export type UpgradeRequestInfo = Omit<HTTPRequestInfo, 'body'>;

export type WebSocketChannel = TopicChannel | UserChannel | ConnectionChannel;

export type EventValue<Kind extends string, Type extends string, Payload> = {
  kind: Kind;
  type: Type;
  payload: Payload;
};

export type ConnectEventValue = EventValue<'connection', 'connect', null>;

export type DisconnectEventValue = EventValue<
  'connection',
  'disconnect',
  ConnectionChannel
>;

export type WebSocketEvent<
  Value extends EventValue<any, any, any>,
  User extends null | MachinatUser
> = Value extends EventValue<infer Kind, infer Type, infer Payload>
  ? {
      platform: 'web_sokcet';
      kind: Kind;
      type: Type;
      payload: Payload;
      channel: ConnectionChannel;
      user: User;
    }
  : never;

export type EventInput = {
  kind?: string;
  type: string;
  payload?: any;
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
  whitelist: null | ConnectionChannel[];
  blacklist: null | ConnectionChannel[];
};

export type WebSocketResult = {
  connections: null | ConnectionChannel[];
};

export type WebSocketDispatchFrame = DispatchFrame<
  WebSocketChannel,
  WebSocketJob,
  WebSocketBot
>;

export type WebSocketMetadata<AuthInfo> = {
  source: 'web_socket';
  request: UpgradeRequestInfo;
  connection: ConnectionChannel;
  auth: AuthInfo;
};

export type WebSocketComponent = NativeComponent<any, UnitSegment<EventInput>>;

export type WebSocketEventContext<
  User extends null | MachinatUser,
  AuthInfo,
  Value extends EventValue<any, any, any> =
    | ConnectEventValue
    | DisconnectEventValue
    | EventValue<string, string, unknown>
> = {
  platform: 'web_socket';
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
  Value extends EventValue<any, any, any>,
  LoginVerifier extends void | VerifyLoginFn<any, any, any> = void
> = {
  entryPath?: string;
  verifyUpgrade?: VerifyUpgradeFn;
  verifyLogin?: LoginVerifier;
  heartbeatInterval?: number;
  eventMiddlewares?: MaybeContainerOf<
    LoginVerifier extends VerifyLoginFn<infer User, infer AuthInfo, any>
      ? WebSocketEventMiddleware<User, AuthInfo>
      : WebSocketEventMiddleware<null, null>
  >[];
  dispatchMiddlewares?: MaybeContainerOf<WebSocketDispatchMiddleware>[];
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
