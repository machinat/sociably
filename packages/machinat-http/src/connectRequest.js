// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { HTTPRequestReceivable } from './types';

const connectRequest = (
  provider:
    | HTTPRequestReceivable
    | (IncomingMessage => HTTPRequestReceivable | void)
) => {
  let httpRequestBotConnector: (
    req: IncomingMessage,
    res: ServerResponse
  ) => void;

  if (typeof provider === 'function') {
    const getBot = provider;

    httpRequestBotConnector = (req: IncomingMessage, res: ServerResponse) => {
      const bot = getBot(req);

      if (bot === undefined) {
        res.statusCode = 404; // eslint-disable-line no-param-reassign
        res.end();
        return;
      }

      bot.adaptor.handleRequest(req, res, req);
    };
  } else {
    const bot = provider;

    httpRequestBotConnector = (req: IncomingMessage, res: ServerResponse) => {
      bot.adaptor.handleRequest(req, res, req);
    };
  }

  return httpRequestBotConnector;
};

export default connectRequest;
