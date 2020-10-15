import type {
  NativeComponent,
  MachinatUser,
  MachinatChannel,
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

export type ConnectEvent<User extends null | MachinatUser> = {
  platform: 'web_sokcet';
  kind: 'connection';
  type: 'connect';
  payload: undefined;
  channel: ConnectionChannel;
  user: User;
};

export type DisconnectEvent<User extends null | MachinatUser> = {
  platform: 'web_sokcet';
  kind: 'connection';
  type: 'disconnect';
  payload: { reason: string };
  channel: ConnectionChannel;
  user: User;
};

export type EventValue<Kind extends string, Type extends string, Payload> = {
  kind: Kind;
  type: Type;
  payload: Payload;
};

export type CustomEvent<
  Value extends EventValue<any, any, any>,
  User extends null | MachinatUser,
  Channel extends MachinatChannel = ConnectionChannel
> = Value extends EventValue<infer Kind, infer Type, infer Payload>
  ? {
      platform: 'web_sokcet';
      kind: Kind;
      type: Type;
      payload: Payload;
      channel: Channel;
      user: User;
    }
  : never;

export type WebSocketEvent<
  Value extends EventValue<any, any, any>,
  User extends null | MachinatUser
> = ConnectEvent<User> | DisconnectEvent<User> | CustomEvent<Value, User>;

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
  Value extends EventValue<any, any, any>,
  User extends null | MachinatUser,
  AuthInfo
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
  Value extends EventValue<any, any, any>,
  User extends null | MachinatUser,
  Auth
> = EventMiddleware<WebSocketEventContext<Value, User, Auth>, null>;

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
      ? WebSocketEventMiddleware<Value, User, AuthInfo>
      : WebSocketEventMiddleware<Value, null, null>
  >[];
  dispatchMiddlewares?: MaybeContainerOf<WebSocketDispatchMiddleware>[];
};

export type WebSocketPlatformMounter<
  Value extends EventValue<any, any, any>,
  User extends null | MachinatUser,
  Auth
> = PlatformMounter<
  WebSocketEventContext<Value, User, Auth>,
  null,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult
>;
