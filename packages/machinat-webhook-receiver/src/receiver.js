// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import getRawBody from 'raw-body';
import { BaseReceiver } from 'machinat-base';

import type { MachinatChannel, MachinatEvent } from 'machinat-base/types';
import type { HTTPRequestReceiver } from 'machinat-http-adaptor/types';
import type {
  WebhookHandler,
  ResponsesHandler,
  WebhookMetadata,
} from './types';

const RAW_BODY_OPTION = { encoding: true };
const WEBHOOK = 'webhook';

const endRes = (res, status, body) => {
  res.statusCode = status; // eslint-disable-line no-param-reassign
  res.end(body);
};

class WebhookReceiver<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Response
> extends BaseReceiver<Channel, Event, WebhookMetadata, Response>
  implements HTTPRequestReceiver {
  _webhookHandler: WebhookHandler<Channel, Event, Response>;
  _responsesHandler: void | ResponsesHandler<Channel, Event, Response>;

  constructor(
    webhookHandler: WebhookHandler<Channel, Event, Response>,
    responsesHandler?: ResponsesHandler<Channel, Event, Response>
  ) {
    super();
    this._webhookHandler = webhookHandler;
    this._responsesHandler = responsesHandler;
  }

  handleRequest(req: IncomingMessage, res: ServerResponse, rawBody?: string) {
    this._handleRequestImpl(req, res, rawBody);
  }

  callback() {
    return this.handleRequest.bind(this);
  }

  async _handleRequestImpl(
    req: IncomingMessage,
    res: ServerResponse,
    rawBody?: string
  ) {
    try {
      if (!this.isBound) {
        endRes(res, 501);
        return;
      }

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

      const eventReports = await this._webhookHandler(req, res, body);

      if (eventReports) {
        const metadata = {
          source: WEBHOOK,
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: body || '',
            encrypted: !!(req: any).connection.encrypted,
          },
        };

        const responses = await Promise.all(
          eventReports.map(({ event, channel }) =>
            this._issueEvent(channel, event, metadata)
          )
        );

        if (!res.finished && this._responsesHandler !== undefined) {
          for (let i = 0; i < eventReports.length; i += 1) {
            eventReports[i].response = responses[i];
          }

          await this._responsesHandler(req, res, eventReports);
        }
      }

      if (!res.finished) {
        endRes(res, 501);
      }
    } catch (err) {
      if (!res.finished) {
        endRes(
          res,
          err.status || 500,
          typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
        );
      }

      this._issueError(err);
    }
  }
}

export default WebhookReceiver;
