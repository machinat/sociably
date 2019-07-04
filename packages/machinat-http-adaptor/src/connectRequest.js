// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { HTTPRequestReceiver, HTTPRequestReceivable } from './types';

const connectRequest = <Receiver: HTTPRequestReceiver>(
  provider:
    | HTTPRequestReceivable<Receiver>
    | (IncomingMessage => HTTPRequestReceivable<Receiver> | void)
): ((req: IncomingMessage, res: ServerResponse) => void) => {
  if (typeof provider === 'function') {
    const getBot = provider;

    const httpRequestBotConnector = (
      req: IncomingMessage,
      res: ServerResponse
    ) => {
      const bot = getBot(req);

      if (bot === undefined) {
        res.statusCode = 404; // eslint-disable-line no-param-reassign
        res.end();
        return;
      }

      bot.receiver.handleRequest(req, res);
    };

    return httpRequestBotConnector;
  }

  return provider.receiver.callback();
};

export default connectRequest;
