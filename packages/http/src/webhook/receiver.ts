import type { IncomingMessage, ServerResponse } from 'http';
import readRawBody from 'raw-body';
import type { RequestHandler, RoutingInfo } from '../types.js';
import type { WebhookHandler } from './types.js';

const RAW_BODY_OPTION = { encoding: true as const };

class WebhookReceiver {
  _handleWebhook: WebhookHandler;

  constructor(webhookHandler: WebhookHandler) {
    this._handleWebhook = webhookHandler;
  }

  handleRequestCallback(): RequestHandler {
    return this.handleRequest.bind(this);
  }

  async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    routingInfo: RoutingInfo
  ): Promise<void> {
    try {
      let body: undefined | string;
      if (
        req.method === 'POST' ||
        req.method === 'PUT' ||
        req.method === 'DELETE' ||
        req.method === 'PATCH'
      ) {
        body = await readRawBody(req, RAW_BODY_OPTION);
      }

      const metadata = {
        source: 'webhook' as const,
        request: {
          method: req.method as string,
          url: req.url as string,
          headers: req.headers,
          body,
        },
      };

      const {
        code,
        headers,
        body: resBody,
      } = await this._handleWebhook(metadata, routingInfo);

      res.writeHead(code, headers);
      res.end(
        typeof resBody === 'string'
          ? resBody
          : resBody
          ? JSON.stringify(resBody)
          : undefined
      );
    } catch (err) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          code: 500,
          message: err.message,
        })
      );
    }
  }
}

export default WebhookReceiver;
