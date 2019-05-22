// @flow
import url from 'url';
import crypto from 'crypto';

import type { IncomingMessage, ServerResponse } from 'http';
import type {
  WebhookHandler,
  WebhookEventReport,
} from 'machinat-webhook-receiver/types';
import type { MessengerBotOptions, MessengerEvent } from './types';

import createEvent from './event';
import MessengerChannel from './channel';

const endRes = (res, code, body) => {
  res.statusCode = code; // eslint-disable-line no-param-reassign
  res.end(body);
  return undefined;
};

const handleWebhook = (
  options: MessengerBotOptions
): WebhookHandler<MessengerChannel, MessengerEvent> => (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody: void | string
) => {
  if (req.method === 'GET') {
    const query: { [string]: string } = (url.parse(req.url, true).query: any);

    if (!options.shouldVerifyWebhook) {
      endRes(res, 403);
    } else if (
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === options.verifyToken
    ) {
      endRes(res, 200, query['hub.challenge']);
    } else {
      endRes(res, 400);
    }

    return undefined;
  }

  if (req.method !== 'POST') {
    endRes(res, 405);
    return undefined;
  }

  if (rawBody === undefined) {
    endRes(res, 400);
    return undefined;
  }

  if (options.shouldValidateRequest) {
    // FIXME: it's refined at client but unable to type it
    const hmac = crypto.createHmac('sha1', options.appSecret);

    hmac.update(rawBody, 'utf8');
    const computedSig = `sha1=${hmac.digest('hex')}`;

    if (req.headers['x-hub-signature'] !== computedSig) {
      return endRes(res, 401);
    }
  }

  let body;
  try {
    body = JSON.parse(rawBody);

    if (body.object !== 'page') {
      return endRes(res, 404);
    }

    const reports: WebhookEventReport<MessengerChannel, MessengerEvent>[] = [];

    for (const { messaging, stanby } of body.entry) {
      const isStandby = stanby !== undefined;
      const rawEvents = isStandby ? stanby : messaging;

      for (const raw of rawEvents) {
        const event = createEvent(isStandby, raw);
        const { type, payload } = event;

        const source =
          type === 'optin' && payload.sender === undefined
            ? { user_ref: payload.optin.user_ref }
            : payload.sender;
        const channel = new MessengerChannel(source);

        const shouldRespond =
          type === 'checkout_update' || type === 'pre_checkout';

        reports.push({ event, channel, shouldRespond });
      }
    }

    return reports;
  } catch (e) {
    endRes(res, 400);
    return undefined;
  }
};

export default handleWebhook;
