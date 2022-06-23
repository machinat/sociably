import type { SociablyUser } from '@sociably/core';
import type {
  AuthController,
  AnyServerAuthenticator,
  ContextOfAuthenticator,
} from '@sociably/auth';
import type {
  EventInput,
  VerifyLoginFn,
  HttpRequestInfo,
  EventValue,
} from '@sociably/websocket';
import { WEBVIEW } from './constant';
import { WebviewConnection } from './channel';
import type { WebviewEvent } from './types';

const WebEventProto = { platform: WEBVIEW };

export const createEvent = <
  User extends null | SociablyUser,
  Value extends EventValue
>(
  value: EventInput,
  channel: WebviewConnection,
  user: User
): WebviewEvent<Value, User> => {
  const event: WebviewEvent<Value, User> = Object.create(WebEventProto);

  const { category, type, payload } = value;
  event.category = category || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

export const useAuthLogin =
  <Authenticator extends AnyServerAuthenticator>(
    controller: AuthController<Authenticator>
  ): VerifyLoginFn<
    SociablyUser,
    ContextOfAuthenticator<Authenticator>,
    string
  > =>
  async (request: HttpRequestInfo, credential: string) => {
    const result = await controller.verifyAuth(request, credential);

    if (!result.ok) {
      const { code, reason } = result;
      return { ok: false as const, code, reason };
    }

    const { context } = result;
    return {
      ok: true as const,
      authContext: context,
      user: context.user,
      expireAt: context.expireAt,
    };
  };

export const verifyOrigin = (origin: string, expectedHost: string): boolean => {
  const [protocol, host] = origin.split('//', 2);
  return protocol === 'https:' && host === expectedHost;
};
