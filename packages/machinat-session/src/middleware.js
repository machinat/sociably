// @flow
import type { MachinatMiddleware, EventFrame } from 'machinat-base/types';
import type { SessionStore } from './types';

const attachSessionMeddleware = (
  store: SessionStore
): MachinatMiddleware<
  EventFrame<any, any, any, any, any, any, any, any>,
  any
> => next => frame =>
  next({
    ...frame,
    session: store.getSession(frame.channel),
  });

export default attachSessionMeddleware;
