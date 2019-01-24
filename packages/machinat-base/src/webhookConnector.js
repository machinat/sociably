// @flow
import { createServer } from 'http';
import type { Server, IncomingMessage, ServerResponse } from 'http';

import getRawBody from 'raw-body';
import thenifiedly from 'thenifiedly';

import BaseConnector from './baseConnector';
import Context from './webhookContext';
import type { MachinatClient, MachinatContext, MachinatEvent } from './types';

type WebhookHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody?: string
) => ?Array<MachinatEvent>;

const RAW_BODY_OPTION = { encoding: true };

const endResponse = thenifiedly.callMethodFactory('end');
const shouldEventRespond = e => !!e.shouldRespond;

class WebhookConnector<
  Client: MachinatClient<any, any, any, any, any>
> extends BaseConnector<MachinatContext<Client>> {
  client: Client;
  server: Server;
  handleWebhook: WebhookHandler;

  constructor(client: Client, handleWebhook: WebhookHandler) {
    super();
    this.client = client;
    this.handleWebhook = handleWebhook;
  }

  callback() {
    const fn = this.createHandler();
    return this.handleRequest(fn);
  }

  listen(...args) {
    const handler = this.callback();
    this.server = createServer((req, res) => {
      handler(req, res).catch(() => {});
    });

    return this.server.listen(...args);
  }

  handleRequest(fn: (MachinatContext<Client>) => Promise<void>) {
    return async (
      req: IncomingMessage,
      res: ServerResponse,
      rawBody?: string,
      httpContext?: any
    ) => {
      let response = null;

      try {
        let body = rawBody;
        if (
          body === undefined &&
          (req.method === 'POST' ||
            req.method === 'PUT' ||
            req.method === 'DELETE' ||
            req.method === 'PATCH')
        ) {
          body = await getRawBody(req, RAW_BODY_OPTION);
        }

        const events = this.handleWebhook(req, res, body);
        if (!events) {
          await endResponse(res);
          return;
        }

        if (events.findIndex(shouldEventRespond) !== -1) {
          response = { status: undefined, body: undefined };
        } else {
          await endResponse(res);
        }

        const contexts = events.map(
          event => new Context(event, this.client, response, httpContext)
        );

        await this.handleEvents(contexts, fn);
      } catch (e) {
        response = { status: e.status || 500, body: e.message };

        this.emit('error', e);
      } finally {
        if (!res.finished && response !== null) {
          res.statusCode = response.status || 501; // eslint-disable-line no-param-reassign
          const body =
            typeof response.body === 'object'
              ? JSON.stringify(response.body)
              : response.body;

          await endResponse(res, body);
        }
      }
    };
  }
}

export default WebhookConnector;
