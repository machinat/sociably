// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import readRawBody from 'raw-body';
import type { WebhookHandler } from './types';

const RAW_BODY_OPTION = { encoding: true };

const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

class WebhookReceiver {
  _handleWebhook: WebhookHandler;

  constructor(webhookHandler: WebhookHandler) {
    this._handleWebhook = webhookHandler;
  }

  handleRequestCallback() {
    return this.handleRequest.bind(this);
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse) {
    try {
      let body;
      if (
        req.method === 'POST' ||
        req.method === 'PUT' ||
        req.method === 'DELETE' ||
        req.method === 'PATCH'
      ) {
        body = await readRawBody(req, RAW_BODY_OPTION);
      }

      const metadata = {
        source: 'webhook',
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body,
        },
      };

      const { code, headers, body: resBody } = await this._handleWebhook(
        metadata
      );

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
