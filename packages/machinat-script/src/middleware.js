// @flow
import type { SessionStore } from 'machinat-session/types';
import type { MachinatMiddleware, EventFrame } from 'machinat-base/types';
import type { MachinatScript } from './types';
import { processInterceptor } from './processor';

const interceptProcessingScriptMiddleware = (
  sessionStore: SessionStore,
  libs: MachinatScript[]
): MachinatMiddleware<
  EventFrame<any, any, any, any, any, any, any, any, any>,
  any
> => next => {
  const intercept = processInterceptor(sessionStore, libs);

  return async frame => {
    const nextFrame = await intercept(frame);
    if (!nextFrame) {
      return null;
    }

    return next(nextFrame);
  };
};

export default interceptProcessingScriptMiddleware;
