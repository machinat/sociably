import type {
  SociablyUser,
  SociablyNode,
  PlatformUtilities,
  EventMiddleware,
  DispatchMiddleware,
  NativeComponent,
} from '@sociably/core';
import { AnyMarshalType } from '@sociably/core/base/Marshaler';
import type { UnitSegment } from '@sociably/core/renderer';
import type { DispatchFrame } from '@sociably/core/engine';
import type { MaybeContainer, ServiceProvider } from '@sociably/core/service';
import type {
  AnyServerAuthenticator,
  ClientAuthenticator,
  AnyAuthContext,
  ContextOfAuthenticator,
  UserOfAuthenticator,
} from '@sociably/auth';
import type { CodeMessageComponent } from '@sociably/auth/basicAuth';
import type { NextServerOptions, HandleNextRequestFn } from '@sociably/next';
import type {
  EventInput,
  EventValue,
  WebSocketMetadata,
  WebSocketJob,
  WebSocketResult,
  WebSocketDispatchResponse,
} from '@sociably/websocket';
import type { BotP } from './Bot';
import type WebviewConnection from './Connection';

export type {
  EventValue,
  EventInput,
  ConnectEventValue,
  DisconnectEventValue,
  ConnectionEventValue,
} from '@sociably/websocket';

export type WebviewComponent = NativeComponent<
  unknown,
  UnitSegment<EventInput>
>;

export type WebviewEvent<
  Value extends EventValue,
  User extends null | SociablyUser
> = Value & {
  platform: 'webview';
  // TODO: channel field is left for potential namespace feature
  channel: null;
  thread: WebviewConnection;
  user: User;
};

export type WebviewMetadata<Context extends AnyAuthContext> = Omit<
  WebSocketMetadata<Context>,
  'connection'
> & { connection: WebviewConnection };

export interface WebviewClientAuthenticator<
  Credential,
  Data,
  Context extends AnyAuthContext
> extends ClientAuthenticator<Credential, Data, Context> {
  closeWebview: (ctx: null | Context) => boolean;
  marshalTypes: null | AnyMarshalType[];
}

export type AnyClientAuthenticator = WebviewClientAuthenticator<
  unknown,
  unknown,
  AnyAuthContext
>;

export type WebviewEventContext<
  Authenticator extends AnyServerAuthenticator = AnyServerAuthenticator,
  Value extends EventValue = EventValue
> = {
  platform: 'webview';
  event: WebviewEvent<Value, UserOfAuthenticator<Authenticator>>;
  metadata: WebviewMetadata<ContextOfAuthenticator<Authenticator>>;
  bot: BotP;
  reply(message: SociablyNode): Promise<null | WebSocketDispatchResponse>;
};

export type WebviewEventMiddleware<
  Authenticator extends AnyServerAuthenticator = AnyServerAuthenticator,
  Value extends EventValue = EventValue
> = EventMiddleware<WebviewEventContext<Authenticator, Value>, null>;

export type WebviewDispatchFrame = DispatchFrame<
  null | WebviewConnection,
  WebSocketJob
>;

export type WebviewDispatchMiddleware = DispatchMiddleware<
  WebSocketJob,
  WebviewDispatchFrame,
  WebSocketResult
>;

export type WebviewConfigs<
  Authenticator extends AnyServerAuthenticator = AnyServerAuthenticator,
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
  nextRequestHandler?: HandleNextRequestFn;

  /** Route path to the web socket server. Default to `"/websocket"` */
  webSocketPath?: string;
  heartbeatInterval?: number;

  /** Auth providers from the platforms */
  authPlatforms?: ServiceProvider<AnyServerAuthenticator, unknown[]>[];
  /** The secret for signing auth token */
  authSecret: string;
  /** Initiate basic auth flow service with the options */
  basicAuth?: {
    /** The user needs to enter a verify code in `strict` mode. Default to `strict` */
    mode?: 'loose' | 'strict';
    /** The app name to show while login using basic auth flow */
    appName?: string;
    /** The app image to show while login using basic auth flow */
    appIconUrl?: string;
    /** The digits of the verify code number. Default to 6 */
    verifyCodeDigits?: number;
    /** The customized component to render code message */
    codeMessageComponent?: CodeMessageComponent;
    /** Max time to verify login code. Default to 5 */
    maxLoginAttempt?: number;
    /** Login session duration in seconds. Default to 10 min */
    loginDuration?: number;
  };
  /** Route path to the auth api. Default to `"/auth"` */
  authApiPath?: string;
  /** The lifetime of the token in seconds. Default to an hour */
  tokenLifetime?: number;
  /** The duration a token can be refreshed in seconds. Default to Infinity */
  refreshDuration?: number;
  /** The MaxAge of the data cookies in seconds. Default to 5 minute */
  dataCookieMaxAge?: number;
  /** The path scope of the auth cookies. Default to '/' */
  cookiePath?: string;
  /** The domain scope of the auth cookies */
  cookieDomain?: string;
  /** The `SameSite` attribute of the auth cookies. Default to `strict` */
  cookieSameSite?: 'strict' | 'lax' | 'none';
  /** Force using HTTPS if set to `true` */
  secure?: boolean;

  eventMiddlewares?: MaybeContainer<
    WebviewEventMiddleware<Authenticator, Value>
  >[];
  dispatchMiddlewares?: MaybeContainer<WebviewDispatchMiddleware>[];
};

export type WebviewPlatformUtilities<
  Authenticator extends AnyServerAuthenticator
> = PlatformUtilities<
  WebviewEventContext<Authenticator, EventValue>,
  null,
  WebSocketJob,
  WebviewDispatchFrame,
  WebSocketResult
>;
