// @flow
import url from 'url';
import type { IncomingMessage, ServerResponse } from 'http';
import { HTTPReceivable } from './types';

export const connect = (bot: HTTPReceivable) => (
  req: IncomingMessage,
  res: ServerResponse
) => {
  bot.adaptor.handleRequest(req, res);
};

export const connectByRoutes = (mapping: { [string]: HTTPReceivable }) => {
  const routes = Object.keys(mapping);

  return (req: IncomingMessage, res: ServerResponse) => {
    const parsed = url.parse(req.url);
    const pathname = parsed.pathname || '';

    for (const route of routes) {
      if (pathname.slice(-route.length) === route) {
        mapping[route].adaptor.handleRequest(req, res);
        return;
      }
    }

    res.statusCode = 404; // eslint-disable-line no-param-reassign
    res.end();
  };
};
