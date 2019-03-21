// @flow
import type { IncomingMessage } from 'http';
import type { HTTPRequestReceivable } from './types';

const createKoaMiddleware = (
  provider:
    | HTTPRequestReceivable
    | (IncomingMessage => HTTPRequestReceivable | void)
) => {
  let koaBotConnector: (ctx: Object) => Promise<void>;

  if (typeof provider === 'function') {
    const getBot = provider;

    koaBotConnector = async (ctx: Object) => {
      const { req, res, request } = ctx;
      const bot = getBot(req);

      if (bot === undefined) {
        ctx.status = 404;
        return;
      }

      bot.adaptor.handleRequest(req, res, ctx, request.rawBody);
      ctx.respond = false;
    };
  } else {
    const bot = provider;

    koaBotConnector = async (ctx: Object) => {
      const { req, res, request } = ctx;

      bot.adaptor.handleRequest(req, res, ctx, request.rawBody);
      ctx.respond = false;
    };
  }

  return koaBotConnector;
};

export default createKoaMiddleware;
