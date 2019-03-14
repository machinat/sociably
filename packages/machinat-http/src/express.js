// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import { HTTPReceivable } from './types';

const createExpressMiddleware = (bot: HTTPReceivable) => {
  const machinatBotHandler = (req: IncomingMessage, res: ServerResponse) =>
    bot.adaptor.handleRequest(req, res, undefined, req);

  return machinatBotHandler;
};

export default createExpressMiddleware;
