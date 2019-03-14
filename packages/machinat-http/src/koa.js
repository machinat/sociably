// @flow
import { HTTPReceivable } from './types';

const createKoaMiddleware = (bot: HTTPReceivable) => {
  const machinatBotHandler = async (ctx: Object) => {
    ctx.status = 200;

    const {
      req,
      res,
      request: { rawBody },
    } = ctx;

    try {
      await bot.adaptor.handleRequest(req, res, rawBody, ctx);
    } finally {
      ctx.respond = false;
    }
  };

  return machinatBotHandler;
};

export default createKoaMiddleware;
