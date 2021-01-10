import type {
  MachinatUser,
  MachinatChannel,
  PlatformMounter,
  EventMiddleware,
  DispatchMiddleware,
  NativeComponent,
} from '@machinat/core/types';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { DispatchFrame } from '@machinat/core/engine/types';
import type { MaybeContainer } from '@machinat/core/service/types';
import type {
  AuthData,
  ServerAuthorizer,
  ClientAuthorizer,
} from '@machinat/auth/types';
import type { NextServerOptions } from '@machinat/next/types';
import type {
  EventInput,
  EventValue,
  WebSocketMetadata,
  WebSocketJob,
  WebSocketResult,
} from '@machinat/websocket/types';
import type { BotP } from './bot';
import type {
  WebviewConnection,
  WebviewTopicChannel,
  WebviewUserChannel,
} from './channel';

export type AnyServerAuthorizer = ServerAuthorizer<any, any, unknown, unknown>;

export type WebviewComponent = NativeComponent<
  unknown,
  UnitSegment<EventInput>
>;

export type WebviewEvent<
  Value extends EventValue<string, string, unknown>,
  User extends null | MachinatUser
> = {
  platform: 'webview';
  kind: Value['kind'];
  type: Value['type'];
  payload: Value['payload'];
  channel: WebviewConnection;
  user: User;
};

export type WebviewMetadata<
  User extends MachinatUser,
  Channel extends MachinatChannel,
  AuthContext
> = Omit<
  WebSocketMetadata<AuthData<User, Channel, AuthContext>>,
  'connection'
> & {
  connection: WebviewConnection;
};

export type WebviewEventContext<
  Authorizer extends AnyServerAuthorizer,
  Value extends EventValue<string, string, unknown> = EventValue<
    string,
    string,
    unknown
  >
> = Authorizer extends ServerAuthorizer<
  infer User,
  infer Channel,
  infer Context,
  unknown
>
  ? {
      platform: 'webview';
      event: WebviewEvent<Value, User>;
      metadata: WebviewMetadata<User, Channel, Context>;
      bot: BotP<Authorizer>;
    }
  : never;

export type WebviewClientEvent<
  Authorizer extends ClientAuthorizer<any, any, unknown, unknown>,
  Value extends EventValue<string, string, unknown> = EventValue<
    string,
    string,
    unknown
  >
> = Authorizer extends ServerAuthorizer<infer User, any, unknown, unknown>
  ? {
      platform: 'webview';
      kind: Value['kind'];
      type: Value['type'];
      payload: Value['payload'];
      channel: WebviewConnection;
      user: User;
    }
  : never;

export type WebviewEventMiddleware<
  Authorizer extends AnyServerAuthorizer,
  Value extends EventValue<string, string, unknown> = EventValue<
    string,
    string,
    unknown
  >
> = EventMiddleware<WebviewEventContext<Authorizer, Value>, null>;

export type WebviewDispatchFrame<
  Authorizer extends AnyServerAuthorizer
> = DispatchFrame<
  WebviewTopicChannel | WebviewUserChannel | WebviewConnection,
  WebSocketJob,
  BotP<Authorizer>
>;

export type WebviewDispatchMiddleware<
  Authorizer extends AnyServerAuthorizer
> = DispatchMiddleware<
  WebSocketJob,
  WebviewDispatchFrame<Authorizer>,
  WebSocketResult
>;

export type WebviewPlatformConfigs<Authorizer extends AnyServerAuthorizer> = {
  /** Route path to the auth backend. Default to `"/auth"` */
  authPath?: string;
  /** Secret to sign token for auth. */
  secret: string;
  /** Valid time for auth token in seconds */
  tokenAge?: number;
  authCookieAge?: number;
  dataCookieAge?: number;
  refreshPeriod?: number;
  cookieDomain?: string;
  cookiePath?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;

  /** Route path to the next server. Default to `"/webview"` */
  nextPath?: string;
  /** Set to `true` for not running NextJS server. */
  noHostNext?: boolean;
  /** Set to `true` for not running #prepare() of NextJS server. */
  noPrepareNext?: boolean;
  /** Options for nextjs server. */
  nextServerOptions?: NextServerOptions;

  /** Route path to the web socket server. Default to `"/websocket"` */
  webSocketPath?: string;
  /** Origin url of the webview host. */
  origin: string;
  heartbeatInterval?: number;
  eventMiddlewares?: MaybeContainer<
    WebviewEventMiddleware<Authorizer, EventValue<string, string, unknown>>
  >[];
  dispatchMiddlewares?: MaybeContainer<WebviewDispatchMiddleware<Authorizer>>[];
};

export type WebviewPlatformMounter<
  Authorizer extends AnyServerAuthorizer
> = PlatformMounter<
  WebviewEventContext<Authorizer, EventValue<string, string, unknown>>,
  null,
  WebSocketJob,
  WebviewDispatchFrame<Authorizer>,
  WebSocketResult
>;
