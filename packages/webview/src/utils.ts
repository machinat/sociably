import { MachinatUser } from '@machinat/core/types';
import Auth, { AuthClient } from '@machinat/auth';
import type {
  ServerAuthorizer,
  GetAuthContextOf,
  ClientAuthorizer,
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

export const useAuthController = <
  Authorizer extends ServerAuthorizer<any, any, unknown, unknown>
>(
  controller: Auth.Controller<Authorizer>
): VerifyLoginFn<MachinatUser, GetAuthContextOf<Authorizer>, string> => async (
  request: HttpRequestInfo,
  credential: string
) => {
  const result = await controller.verifyAuth(request, credential);

  if (!result.success) {
    const { code, reason } = result;
    return { success: false as const, code, reason };
  }

  const { auth } = result;
  return {
    success: true as const,
    authInfo: auth,
    user: auth.user,
    expireAt: auth.expireAt,
  };
};

export const useAuthClient = <
  User extends MachinatUser,
  Authorizer extends ClientAuthorizer<User, any, unknown, unknown>
>(
  controller: AuthClient<Authorizer>
): ClientLoginFn<User, string> => async () => {
  const { token, context } = await controller.auth();
  return { user: context.user, credential: token };
};
