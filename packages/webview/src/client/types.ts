import type { UserOfAuthorizer, ContextOfAuthorizer } from '@machinat/auth';
import type { EventValue, WebviewEvent, AnyClientAuthorizer } from '../types';
import type WebviewClient from './client';

export type ClientEventContext<
  Authorizer extends AnyClientAuthorizer,
  Value extends EventValue
> = {
  event: WebviewEvent<Value, UserOfAuthorizer<Authorizer>>;
  authorizer: Authorizer;
  auth: ContextOfAuthorizer<Authorizer>;
};

export type EventContextOfClient<
  Client extends WebviewClient<AnyClientAuthorizer, EventValue>
> = Client extends WebviewClient<infer Authorizer, infer Value>
  ? ClientEventContext<Authorizer, Value>
  : never;

export type ClientOptions<Authorizer extends AnyClientAuthorizer> = {
  /** URL string to connect WebSocket backend. Default to `"/websocket"` */
  webSocketUrl?: string;
  /** Secify the platform to login. Default to the value of `platform` querystring */
  platform?: string;
  /** URL of the auth backend API. Default to `"/auth"` */
  authApiUrl?: string;
  /** Authorizers of the platforms. */
  authorizers: Authorizer[];
  /**
   * When set to true, the underlying network operations would not be executed.
   * It's useful for server rendering at server side.
   */
  mockupMode?: boolean;
};
