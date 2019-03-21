// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import getRawBody from 'raw-body';

import type {
  MachinatThread,
  EventHandler,
  MachinatEvent,
  MachinatAdaptor,
} from 'machinat-base/types';
import { HTTPRequestReceiver } from 'machinat-http/types';
import type { WebhookHandler, WebhookResponse } from './types';

const RAW_BODY_OPTION = { encoding: true };
const WEBHOOK = 'webhook';

const endRes = (res, status, body) => {
  res.statusCode = status; // eslint-disable-line no-param-reassign
  res.end(body);
};

class WebhookReceiver<
  Thread: MachinatThread<any, any>,
  Event: MachinatEvent<any, Thread>
>
  implements
    HTTPRequestReceiver,
    MachinatAdaptor<WebhookResponse, Thread, Event> {
  handleWebhook: WebhookHandler<Thread, Event>;
  isBound: boolean;
  _handleEvent: EventHandler<WebhookResponse, Thread, Event>;

  constructor(handleWebhook: WebhookHandler<Thread, Event>) {
    this.handleWebhook = handleWebhook;
    this.isBound = false;
  }

  bind(handleEvent: EventHandler<WebhookResponse, Thread, Event>) {
    if (this.isBound) {
      return false;
    }

    this._handleEvent = handleEvent;
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

      let shouldRespond = false;
      const promises = new Array(events.length);

      for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        promises[i] = this._handleEvent(WEBHOOK, event, httpContext);

        if (event.shouldRespond) {
          shouldRespond = true;
        }
      }

      if (!shouldRespond) {
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
    }
  }
}

export default WebhookReceiver;
