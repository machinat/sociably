// @flow
import type { IncomingMessage } from 'http';
import type { HTTPRequestReceiver, HTTPRequestReceivable } from './types';

const createHapiHandler = <Receiver: HTTPRequestReceiver>(
  provider:
    | HTTPRequestReceivable<Receiver>
    | (IncomingMessage => HTTPRequestReceivable<Receiver> | void)
) => {
  if (typeof provider === 'function') {
    const getBot = provider;

    const hapiHandler = (request: Object, h: Object) => {
      const { payload } = request;
      const { req, res } = request.raw;
      const bot = getBot(req);

      if (bot === undefined) {
        return h.response('Not Found').code(404);
      }

      bot.receiver.handleRequest(req, res, payload.toString('utf8'));
      return h.abandon;
    };

    return hapiHandler;
  }

  const callback = provider.receiver.callback();

  const hapiHandler = (request: Object, h: Object) => {
    const { payload } = request;
    const { req, res } = request.raw;

    callback(req, res, payload.toString('utf8'));
    return h.abandon;
  };

  return hapiHandler;
};

export default createHapiHandler;
