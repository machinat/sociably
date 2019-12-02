// @flow
import type { ServerAuthenticatorFunc } from './types';

export { default } from './bot';
export { Event } from './component';

export const authenticateAny: ServerAuthenticatorFunc<null, any> = () =>
  Promise.resolve({
    accepted: true,
    user: null,
    context: null,
    expireAt: null,
  });
