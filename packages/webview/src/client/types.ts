import type { UserOfAuthorizer, ContextOfAuthorizer } from '@machinat/auth';
import type { EventValue, WebviewEvent, AnyClientAuthorizer } from '../types';
import type WebviewClient from './client';

export type ClientEventContext<
  Authorizer extends AnyClientAuthorizer,
  Value extends EventValue
> = Authorizer extends AnyClientAuthorizer
  ? {
      event: WebviewEvent<Value, UserOfAuthorizer<Authorizer>>;
      authorizer: Authorizer;
      auth: ContextOfAuthorizer<Authorizer>;
    }
  : never;

export type EventContextOfClient<
  Client extends WebviewClient<AnyClientAuthorizer, EventValue>
> = Client extends WebviewClient<infer Authorizer, infer Value>
  ? ClientEventContext<Authorizer, Value>
  : never;

export type ClientOptions<Authorizer extends AnyClientAuthorizer> = {
  /** URL string to connect WebSocket backend. Default to `"/websocket"` */
  webSocketUrl?: string;
  /** Secify the platform to ligin. Default to the `platform` querystring param */
  platform?: string;
  /** URL string to connect auth backend. Default to `"/auth"` */
  authApiUrl?: string;
  /** Authorizer of available platforms. */
  authorizers: Authorizer[];
  /**
   * When set to true, the underlying socket will not really connecct. It is
   * useful for server rendering at server side.
   */
  mockupMode?: boolean;
};
