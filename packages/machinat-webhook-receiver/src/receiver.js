// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import getRawBody from 'raw-body';

import type {
  MachinatThread,
  EventHandler,
  MachinatEvent,
  MachinatReceiver,
} from 'machinat-base/types';
import { HTTPRequestReceiver } from 'machinat-http-adaptor/types';
import type {
  WebhookHandler,
  WebhookResponse,
  WebhookTransport,
} from './types';

const RAW_BODY_OPTION = { encoding: true };
const WEBHOOK = 'webhook';

const endRes = (res, status, body) => {
  res.statusCode = status; // eslint-disable-line no-param-reassign
  res.end(body);
};

class WebhookReceiver<Thread: MachinatThread, Event: MachinatEvent<any>>
  implements
    HTTPRequestReceiver,
    MachinatReceiver<WebhookResponse, Thread, Event, WebhookTransport> {
  handleWebhook: WebhookHandler<Thread, Event>;
  isBound: boolean;

  _handleEvent: EventHandler<WebhookResponse, Thread, Event, WebhookTransport>;
  _handleError: (e: Error) => void;

  constructor(handleWebhook: WebhookHandler<Thread, Event>) {
    this.handleWebhook = handleWebhook;
    this.isBound = false;
  }

  bind(
    handleEvent: EventHandler<WebhookResponse, Thread, Event, WebhookTransport>,
    errorHandler: (e: Error) => void
  ) {
    if (this.isBound) {
      return false;
    }

    this._handleEvent = handleEvent;
    this._handleError = errorHandler;

    this.isBound = true;
    return true;
  }

  unbind() {
    if (!this.isBound) {
      return false;
    }

    this.isBound = false;
    return true;
  }

  handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    httpContext?: Object,
    rawBody?: string
  ) {
    this._handleRequestImpl(req, res, httpContext, rawBody);
  }

  async _handleRequestImpl(
    req: IncomingMessage,
    res: ServerResponse,
    httpContext?: any,
    rawBody?: string
  ) {
    try {
      if (!this.isBound) {
        endRes(res, 501);
        return;
      }

      let reqBody = rawBody;
      if (
        reqBody === undefined &&
        (req.method === 'POST' ||
          req.method === 'PUT' ||
          req.method === 'DELETE' ||
          req.method === 'PATCH')
      ) {
        reqBody = await getRawBody(req, RAW_BODY_OPTION);
      }

      const events = this.handleWebhook(req, res, reqBody);
      if (!events) {
        endRes(res, 200);
        return;
      }

      let shouldWaitRespond = false;
      const promises = new Array(events.length);

      const transport = { source: WEBHOOK, context: httpContext };

      for (let i = 0; i < events.length; i += 1) {
        const { event, thread, shouldRespond } = events[i];
        promises[i] = this._handleEvent(thread, event, transport);

        if (shouldRespond) {
          shouldWaitRespond = true;
        }
      }

      if (!shouldWaitRespond) {
        endRes(res, 200);
      }

      const responses = await Promise.all(promises);

      if (!res.finished) {
        for (const response of responses) {
          if (response !== undefined) {
            const { status, body } = response;
            endRes(
              res,
              status,
              body === undefined || typeof body === 'string'
                ? body
                : JSON.stringify(body)
            );
            break;
          }

          endRes(res, 501);
        }
      }
    } catch (err) {
      if (!res.finished) {
        endRes(
          res,
          err.status || 500,
          typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
        );
      }

      this._handleError(err);
    }
  }
}

export default WebhookReceiver;
