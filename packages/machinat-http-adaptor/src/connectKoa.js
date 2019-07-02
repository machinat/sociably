// @flow
import type { IncomingMessage } from 'http';
import type { HTTPRequestReceivable } from './types';

const createKoaMiddleware = (
  provider:
    | HTTPRequestReceivable
    | (IncomingMessage => HTTPRequestReceivable | void)
): ((ctx: Object) => Promise<void>) => {
  if (typeof provider === 'function') {
    const getBot = provider;

    const koaBotConnector = async (ctx: Object) => {
      const { req, res, request } = ctx;
      const bot = getBot(req);

      if (bot === undefined) {
        ctx.status = 404;
        return;
      }

      bot.receiver.handleRequest(req, res, request.rawBody);
      ctx.respond = false;
    };

    return koaBotConnector;
  }

  const callback = provider.receiver.callback();

  const koaBotConnector = async (ctx: Object) => {
    const { req, res, request } = ctx;

    callback(req, res, request.rawBody);
    ctx.respond = false;
  };

  return koaBotConnector;
};

export default createKoaMiddleware;
