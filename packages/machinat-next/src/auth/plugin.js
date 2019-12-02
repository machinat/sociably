// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { AuthServer } from 'machinat-auth';
import type { NextPlugin } from '../types';

const handleAuthRequest = (controller: AuthServer): NextPlugin => () => ({
  eventMiddleware(next) {
    return async frame => {
      const { payload } = frame.event;
      const req: IncomingMessage = (payload.req: any);
      const res: ServerResponse = (payload.res: any);

      const isDelegated = await controller.delegateAuthRequest(req, res);
      if (isDelegated) {
        return { accepted: true };
      }

      return next(frame);
    };
  },
});

export default handleAuthRequest;
