// @flow
import type EventEmitter from 'events';
import type {
  NativeComponent,
  MachinatChannel,
  MachinatEvent,
  MachinatUser,
  MachinatMetadata,
  EventContext,
  PlatformMounter,
  EventMiddleware,
  DispatchMiddleware,
} from '@machinat/core/types';
import type { DispatchFrame } from '@machinat/core/engine/types';
import type { ServiceContainer } from '@machinat/core/service/types';
import WebSocketBot from './bot';
import type { TopicChannel, UserChannel, ConnectionChannel } from './channel';

export type WebSocketEvent = {
  platform: 'websocket',
  type: string,
  subtype?: string,
  payload: any,
};

declare var e: WebSocketEvent;
(e: MachinatEvent<any>);

export type WebSocketChannel = TopicChannel | UserChannel | ConnectionChannel;

declare var c: WebSocketChannel;
(c: MachinatChannel);

export type EventValue = {|
  type: string,
  subtype?: string,
  payload?: any,
|};

type ConnectionTarget = {
  +type: 'connection',
  +serverId: string,
  +connectionId: string,
};

type TopicTarget = {
  +type: 'topic',
  +name: string,
};

type UserTarget = {
  +type: 'user',
  +userUId: string,
};

export type DispatchTarget = ConnectionTarget | TopicTarget | UserTarget;

export type WebSocketJob = {|
  target: DispatchTarget,
  events: EventValue[],
  whitelist: null | ConnectionChannel[],
  blacklist: null | ConnectionChannel[],
|};

export type WebSocketResult = {
  connections: null | ConnectionChannel[],
};

export type WebSocketDispatchFrame = DispatchFrame<
  WebSocketChannel,
  WebSocketJob,
  WebSocketBot
>;

export type RequestInfo = {|
  method: string,
  url: string,
  headers: {| [string]: string |},
|};

export type WebSocketMetadata<AuthInfo> = {|
  source: 'websocket',
  request: RequestInfo,
  auth: AuthInfo,
|};

declare var m: WebSocketMetadata<any>;
(m: MachinatMetadata<'websocket'>);

export type WebSocketComponent = NativeComponent<any, EventValue>;

export type WebSocketEventContext<AuthInfo> = EventContext<
  WebSocketChannel,
  null | MachinatUser,
  WebSocketEvent,
  WebSocketMetadata<AuthInfo>,
  WebSocketBot
>;

type SuccessVerifyLoginResult<AuthInfo> = {|
  success: true,
  authInfo: AuthInfo,
  user: null | MachinatUser,
  expireAt?: Date,
|};

type FailedVerifyLoginResult = {|
  success: false,
  code: number,
  reason: string,
|};

export type VerifyLoginResult<AuthInfo> =
  | SuccessVerifyLoginResult<AuthInfo>
  | FailedVerifyLoginResult;

export type VerifyLoginFn<AuthInfo, Credential> = (
  RequestInfo,
  Credential
) => Promise<VerifyLoginResult<AuthInfo>>;

export type VerifyUpgradeFn = (
  request: RequestInfo
) => boolean | Promise<boolean>;

export type ClientLoginFn<Credential> = () => Promise<{
  user: null | MachinatUser,
  credential: Credential,
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
  entryPath?: string,
  verifyUpgrade?: VerifyUpgradeFn,
  verifyLogin?: VerifyLoginFn<AuthInfo, Credential>,
  heartbeatInterval?: number,
  eventMiddlewares?: (
    | WebSocketEventMiddleware<AuthInfo>
    | ServiceContainer<WebSocketEventMiddleware<AuthInfo>>
  )[],
  dispatchMiddlewares?: (
    | WebSocketDispatchMiddleware
    | ServiceContainer<WebSocketDispatchMiddleware>
  )[],
};

export type WebSocketPlatformMounter<Auth> = PlatformMounter<
  WebSocketEventContext<Auth>,
  null,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult
>;

export type WS = {
  ...WebSocket,
  ...EventEmitter,
};
