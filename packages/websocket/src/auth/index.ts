import type {
  ServerAuthorizer,
  ClientAuthorizer,
  AuthContext,
} from '@machinat/auth/types';
import type {
  WebSocketEventContext,
  WebSocketEvent,
  EventValue,
} from '../types';

export { default as useAuthController } from './server';
export { default as useAuthClient } from './client';

export type AuthorizedEventContext<
  Value extends EventValue<any, any, any>,
  Authorizer extends ServerAuthorizer<any, any, any, any>
> = Authorizer extends ServerAuthorizer<
  infer User,
  infer Channel,
  infer AuthData,
  any
>
  ? WebSocketEventContext<Value, User, AuthContext<User, Channel, AuthData>>
  : never;

export type AuthorizedClientEvent<
  Value extends EventValue<any, any, any>,
  Authorizer extends ClientAuthorizer<any, any, any, any>
> = Authorizer extends ServerAuthorizer<
  infer User,
  infer Channel,
  infer AuthData,
  any
>
  ? WebSocketEvent<Value, User>
  : never;
