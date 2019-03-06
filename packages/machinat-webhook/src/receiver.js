// @flow
import type { IncomingMessage, ServerResponse } from 'http';

import getRawBody from 'raw-body';

import type {
  MachinatThread,
  HTTPReceiver,
  EventHandler,
  MachinatEvent,
} from 'machinat-base/types';
import type { WebhookHandler, WebhookResponse } from './types';

const RAW_BODY_OPTION = { encoding: true };
const WEBHOOK = 'webhook';

const endRes = (res, status, body) => {
  res.statusCode = status; // eslint-disable-line
  res.end(body);
};

class WebhookReceiver<
  Thread: MachinatThread<any, any>,
  Event: MachinatEvent<any, Thread>
> implements HTTPReceiver {
  handleWebhook: WebhookHandler<Thread, Event>;
  handleEvent: EventHandler<WebhookResponse, Thread, Event>;

  constructor(
    handleWebhook: WebhookHandler<Thread, Event>,
    handleEvent: EventHandler<WebhookResponse, Thread, Event>
  ) {
    this.handleWebhook = handleWebhook;
    this.handleEvent = handleEvent;
  }

  async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    rawBody?: string,
    httpContext?: any
  ) {
    try {
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
        promises[i] = this.handleEvent(event, WEBHOOK, httpContext);

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
          err.status || 501,
          typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
        );
      }
    }
  }
}

export default WebhookReceiver;
