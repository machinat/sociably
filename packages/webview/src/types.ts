import type {
  MachinatUser,
  MachinatNode,
  PlatformUtilities,
  EventMiddleware,
  DispatchMiddleware,
  NativeComponent,
} from '@machinat/core';
import { AnyMarshalType } from '@machinat/core/base/Marshaler';
import type { UnitSegment } from '@machinat/core/renderer';
import type { DispatchFrame } from '@machinat/core/engine';
import type { MaybeContainer } from '@machinat/core/service';
import type {
  AnyServerAuthorizer,
  ClientAuthorizer,
  AnyAuthContext,
  ContextOfAuthorizer,
  UserOfAuthorizer,
} from '@machinat/auth';
import type { NextServerOptions } from '@machinat/next';
import type {
  EventInput,
  EventValue,
  WebSocketMetadata,
  WebSocketJob,
  WebSocketResult,
  WebSocketDispatchResponse,
} from '@machinat/websocket';
import type { BotP } from './bot';
import type {
  WebviewConnection,
  WebviewTopicChannel,
  WebviewUserChannel,
} from './channel';

export type {
  EventValue,
  EventInput,
  ConnectEventValue,
  DisconnectEventValue,
  ConnectionEventValue,
} from '@machinat/websocket';

export type WebviewComponent = NativeComponent<
  unknown,
  UnitSegment<EventInput>
>;

export type WebviewEvent<
  Value extends EventValue,
  User extends null | MachinatUser
> = Value & {
  platform: 'webview';
  channel: WebviewConnection;
  user: User;
};

export type WebviewMetadata<Context extends AnyAuthContext> = Omit<
  WebSocketMetadata<Context>,
  'connection'
> & { connection: WebviewConnection };

export interface WebviewClientAuthorizer<
  Credential,
  Data,
  Context extends AnyAuthContext
> extends ClientAuthorizer<Credential, Data, Context> {
  closeWebview: () => boolean;
  marshalTypes: null | AnyMarshalType[];
}

export type AnyClientAuthorizer = WebviewClientAuthorizer<
  unknown,
  unknown,
  AnyAuthContext
>;

export type WebviewEventContext<
  Authorizer extends AnyServerAuthorizer,
  Value extends EventValue = EventValue
> = {
  platform: 'webview';
  event: WebviewEvent<Value, UserOfAuthorizer<Authorizer>>;
  metadata: WebviewMetadata<ContextOfAuthorizer<Authorizer>>;
  bot: BotP<Authorizer>;
  reply(message: MachinatNode): Promise<null | WebSocketDispatchResponse>;
};

export type WebviewEventMiddleware<
  Authorizer extends AnyServerAuthorizer,
  Value extends EventValue = EventValue
> = EventMiddleware<WebviewEventContext<Authorizer, Value>, null>;

export type WebviewDispatchChannel =
  | WebviewTopicChannel
  | WebviewUserChannel
  | WebviewConnection;

export type WebviewDispatchFrame = DispatchFrame<
  WebviewDispatchChannel,
  WebSocketJob
>;

export type WebviewDispatchMiddleware = DispatchMiddleware<
  WebSocketJob,
  WebviewDispatchFrame,
  WebSocketResult
>;

export type WebviewConfigs<
  Authorizer extends AnyServerAuthorizer,
  Value extends EventValue = EventValue
> = {
  /** Host of the webview. */
  webviewHost: string;
  /** Route path to the webview pages, default to `"/"`. */
  webviewPath?: string;
  /** Set to `true` for not running NextJS server. */
  noNextServer?: boolean;
  /** Set to `true` for not running #prepare() of NextJS server. */
  noPrepareNext?: boolean;
  /** Options for nextjs server. */
  nextServerOptions?: NextServerOptions;

  /** Route path to the web socket server. Default to `"/websocket"` */
  webSocketPath?: string;
  heartbeatInterval?: number;

  /** Secret to sign token for auth. */
  authSecret: string;
  /** Route path to the auth api. Default to `"/auth"` */
  authApiPath?: string;
  /** Survival time of auth token in seconds */
  tokenAge?: number;
  authRedirectUrl?: string;
  authCookieAge?: number;
  dataCookieAge?: number;
  refreshPeriod?: number;
  cookieDomain?: string;
  cookiePath?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;

  eventMiddlewares?: MaybeContainer<
    WebviewEventMiddleware<Authorizer, Value>
  >[];
  dispatchMiddlewares?: MaybeContainer<WebviewDispatchMiddleware>[];
};

export type WebviewPlatformUtilities<Authorizer extends AnyServerAuthorizer> =
  PlatformUtilities<
    WebviewEventContext<Authorizer, EventValue>,
    null,
    WebSocketJob,
    WebviewDispatchFrame,
    WebSocketResult
  >;
