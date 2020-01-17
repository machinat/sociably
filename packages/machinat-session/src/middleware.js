// @flow
import type { MachinatMiddleware, EventContext } from 'machinat-base/types';
import type { SessionStore } from './types';

const attachSessionMeddleware = (
  store: SessionStore
): MachinatMiddleware<
  EventContext<any, any, any, any, any, any, any, any, any>,
  any
> => next => frame =>
  next({
    ...frame,
    session: store.getSession(frame.channel),
  });

export default attachSessionMeddleware;
