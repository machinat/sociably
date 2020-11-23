import type {
  ServerAuthorizer,
  ClientAuthorizer,
  GetAuthContextOf,
} from '@machinat/auth/types';
import type {
  WebSocketEventContext,
  WebSocketEvent,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
} from '../types';

export { default as useAuthController } from './server';
export { default as useAuthClient } from './client';

export type AuthorizedEventContext<
  Authorizer extends ServerAuthorizer<any, any, any, any>,
  Value extends EventValue<any, any, any> =
    | ConnectEventValue
    | DisconnectEventValue
    | EventValue<string, string, unknown>
> = Authorizer extends ServerAuthorizer<
  infer User,
  infer Channel,
  infer AuthData,
  any
>
  ? WebSocketEventContext<User, GetAuthContextOf<Authorizer>, Value>
  : never;

export type AuthorizedClientEvent<
  Authorizer extends ClientAuthorizer<any, any, any, any>,
  Value extends EventValue<any, any, any> =
    | ConnectEventValue
    | DisconnectEventValue
    | EventValue<string, string, unknown>
> = Authorizer extends ServerAuthorizer<infer User, any, any, any>
  ? WebSocketEvent<Value, User>
  : never;
