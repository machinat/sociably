// @flow
import type { EventFrame } from 'machinat-base/types';
import type { SessionStore } from './types';

const attachSession = (store: SessionStore) => (
  frame: EventFrame<any, any, any, any, any, any, any, any>
) => ({
  ...frame,
  session: store.getSession(frame.channel),
});

export default attachSession;
