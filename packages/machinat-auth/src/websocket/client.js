// @flow
import type { ClientRegistratorFunc } from 'machinat-websocket/types';
import type ClientController from '../client';

const registerAuth = (
  client: ClientController
): ClientRegistratorFunc<{ token: string }> => async () => {
  if (client.authContext) {
    return {
      user: client.authContext.user,
      data: { token: (client.getToken(): any) },
    };
  }

  const context = await client.auth();
  return {
    user: context.user,
    data: { token: (client.getToken(): any) },
  };
};

export default registerAuth;
