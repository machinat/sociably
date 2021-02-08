import { MachinatUser } from '@machinat/core/types';
import Auth from '@machinat/auth';
import AuthClient from '@machinat/auth/client';
import type {
  AnyServerAuthorizer,
  AnyClientAuthorizer,
  ContextOfAuthorizer,
  UserOfAuthorizer,
} from '@machinat/auth/types';
import type {
  EventInput,
  VerifyLoginFn,
  HttpRequestInfo,
  ClientLoginFn,
} from '@machinat/websocket/types';
import { WEBVIEW } from './constant';
import { WebviewConnection } from './channel';
import type { WebviewEvent } from './types';

const WebEventProto = { platform: WEBVIEW };

export const createEvent = <User extends null | MachinatUser>(
  value: EventInput,
  channel: WebviewConnection,
  user: User
): WebviewEvent<any, User> => {
  const event: WebviewEvent<any, User> = Object.create(WebEventProto);

  const { kind, type, payload } = value;
  event.kind = kind || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

export const useAuthController = <Authorizer extends AnyServerAuthorizer>(
  controller: Auth.Controller<Authorizer>
): VerifyLoginFn<
  MachinatUser,
  ContextOfAuthorizer<Authorizer>,
  string
> => async (request: HttpRequestInfo, credential: string) => {
  const result = await controller.verifyAuth(request, credential);

  if (!result.success) {
    const { code, reason } = result;
    return { success: false as const, code, reason };
  }

  const { context } = result;
  return {
    success: true as const,
    authContext: context,
    user: context.user,
    expireAt: context.expireAt,
  };
};

export const useAuthClient = <Authorizer extends AnyClientAuthorizer>(
  controller: AuthClient<Authorizer>
): ClientLoginFn<UserOfAuthorizer<Authorizer>, string> => async () => {
  const { token, context } = await controller.auth();
  return {
    user: context.user as UserOfAuthorizer<Authorizer>,
    credential: token,
  };
};

export const verifyOrigin = (origin: string, expectedHost: string): boolean => {
  const [protocol, host] = origin.split('//', 2);
  return protocol === 'https:' && host === expectedHost;
};
