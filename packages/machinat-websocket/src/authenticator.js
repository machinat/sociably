// @flow
import type { ConnectionAuthenticator } from './types';

export const allowDefaultAnonymously: ConnectionAuthenticator = pass => async (
  auth,
  request
) =>
  auth.type === 'default'
    ? { accepted: true, user: null, tags: null }
    : pass(auth, request);

export const allowAllAnonymously: ConnectionAuthenticator = () => async () => ({
  accepted: true,
  user: null,
  tags: null,
});
