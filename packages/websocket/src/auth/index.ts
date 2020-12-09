import type {
  ServerAuthorizer,
  ClientAuthorizer,
  GetAuthContextOf,
} from '@machinat/auth/types';
import type {
  WebSocketEventContext,
  WebSocketEvent,
  EventValue,
} from '../types';

export { default as useAuthController } from './server';
export { default as useAuthClient } from './client';

export type AuthorizedEventContext<
  Authorizer extends ServerAuthorizer<any, any, unknown, unknown>,
  Value extends EventValue<string, string, unknown> = EventValue<
    string,
    string,
    unknown
  >
> = Authorizer extends ServerAuthorizer<infer User, any, unknown, unknown>
  ? WebSocketEventContext<User, GetAuthContextOf<Authorizer>, Value>
  : never;

export type AuthorizedClientEvent<
  Authorizer extends ClientAuthorizer<any, any, unknown, unknown>,
  Value extends EventValue<string, string, unknown> = EventValue<
    string,
    string,
    unknown
  >
> = Authorizer extends ServerAuthorizer<infer User, any, unknown, unknown>
  ? WebSocketEvent<Value, User>
  : never;
