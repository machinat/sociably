import type { UserOfAuthorizer, ContextOfAuthorizer } from '@machinat/auth';
import type { EventValue, WebviewEvent, AnyClientAuthorizer } from '../types';
import type WebviewClient from './client';

export type ClientEventContext<
  Authorizer extends AnyClientAuthorizer,
  Value extends EventValue
> = Authorizer extends AnyClientAuthorizer
  ? {
      platform: Authorizer['platform'];
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
