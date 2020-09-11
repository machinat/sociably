import type {
  NativeComponent,
  MachinatUser,
  EventContext,
  PlatformMounter,
  EventMiddleware,
  DispatchMiddleware,
} from '@machinat/core/types';
import type { DispatchFrame } from '@machinat/core/engine/types';
import type { ServiceContainer } from '@machinat/core/service/types';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { HTTPRequestInfo } from '@machinat/http/types';
import type { WebSocketBot } from './bot';
import type { TopicChannel, UserChannel, ConnectionChannel } from './channel';

export type UpgradeRequestInfo = Omit<HTTPRequestInfo, 'body'>;

export type WebSocketChannel = TopicChannel | UserChannel | ConnectionChannel;

export type ConnectEvent = {
  platform: 'web_sokcet';
  kind: 'connection';
  type: 'connect';
  payload: undefined;
};

export type DisconnectEvent = {
  platform: 'web_sokcet';
  kind: 'connection';
  type: 'disconnect';
  payload: { reason: string };
};

export type CustomEvent = {
  platform: 'web_sokcet';
  kind: string;
  type: string;
  payload: any;
};

export type WebSocketEvent = ConnectEvent | DisconnectEvent | CustomEvent;

export type EventInput = {
  kind?: string;
  type: string;
  payload?: any;
};

export type EventValue = {
  kind: string;
  type: string;
  payload: any;
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
  auth: AuthInfo;
};

export type WebSocketComponent = NativeComponent<any, UnitSegment<EventInput>>;

export type WebSocketEventContext<AuthInfo> = EventContext<
  WebSocketChannel,
  null | MachinatUser,
  WebSocketEvent,
  WebSocketMetadata<AuthInfo>,
  WebSocketBot
>;

type SuccessVerifyLoginResult<AuthInfo> = {
  success: true;
  authInfo: AuthInfo;
  user: null | MachinatUser;
  expireAt?: Date;
};

type FailedVerifyLoginResult = {
  success: false;
  code: number;
  reason: string;
};

export type VerifyLoginResult<AuthInfo> =
  | SuccessVerifyLoginResult<AuthInfo>
  | FailedVerifyLoginResult;

export type VerifyLoginFn<AuthInfo, Credential> = (
  request: UpgradeRequestInfo,
  credential: Credential
) => Promise<VerifyLoginResult<AuthInfo>>;

export type VerifyUpgradeFn = (
  request: UpgradeRequestInfo
) => boolean | Promise<boolean>;

export type ClientLoginFn<Credential> = () => Promise<{
  user: null | MachinatUser;
  credential: Credential;
}>;

export type WebSocketEventMiddleware<Auth> = EventMiddleware<
  WebSocketEventContext<Auth>,
  null
>;

export type WebSocketDispatchMiddleware = DispatchMiddleware<
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult
>;

export type WebSocketPlatformConfigs<AuthInfo, Credential> = {
  entryPath?: string;
  verifyUpgrade?: VerifyUpgradeFn;
  verifyLogin?: VerifyLoginFn<AuthInfo, Credential>;
  heartbeatInterval?: number;
  eventMiddlewares?: (
    | WebSocketEventMiddleware<AuthInfo>
    | ServiceContainer<WebSocketEventMiddleware<AuthInfo>>
  )[];
  dispatchMiddlewares?: (
    | WebSocketDispatchMiddleware
    | ServiceContainer<WebSocketDispatchMiddleware>
  )[];
};

export type WebSocketPlatformMounter<Auth> = PlatformMounter<
  WebSocketEventContext<Auth>,
  null,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult
>;
