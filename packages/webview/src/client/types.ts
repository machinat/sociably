import type {
  UserOfAuthenticator,
  ContextOfAuthenticator,
} from '@machinat/auth';
import type {
  EventValue,
  WebviewEvent,
  AnyClientAuthenticator,
} from '../types';
import type WebviewClient from './client';

export type ClientEventContext<
  Authenticator extends AnyClientAuthenticator,
  Value extends EventValue
> = {
  event: WebviewEvent<Value, UserOfAuthenticator<Authenticator>>;
  authenticator: Authenticator;
  auth: ContextOfAuthenticator<Authenticator>;
};

export type EventContextOfClient<
  Client extends WebviewClient<AnyClientAuthenticator, EventValue>
> = Client extends WebviewClient<infer Authenticator, infer Value>
  ? ClientEventContext<Authenticator, Value>
  : never;

export type ClientOptions<Authenticator extends AnyClientAuthenticator> = {
  /** URL string to connect WebSocket backend. Default to `"/websocket"` */
  webSocketUrl?: string;
  /** Secify the platform to login. Default to the value of `platform` querystring */
  platform?: string;
  /** URL of the auth backend API. Default to `"/auth"` */
  authApiUrl?: string;
  /** Authenticators of the platforms. */
  authenticators: Authenticator[];
  /**
   * When set to true, the underlying network operations would not be executed.
   * It's useful for server rendering at server side.
   */
  mockupMode?: boolean;
};
