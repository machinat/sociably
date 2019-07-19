// @flow
import url from 'url';
import crypto from 'crypto';

import type { IncomingMessage, ServerResponse } from 'http';
import type {
  WebhookHandler,
  ResponsesHandler,
} from 'machinat-webhook-receiver/types';
import type {
  MessengerBotOptions,
  MessengerEvent,
  MessengerResponse,
} from './types';

import createEvent from './event';
import MessengerChannel from './channel';

const endRes = (res, code, body) => {
  res.statusCode = code; // eslint-disable-line no-param-reassign
  res.end(body);
};

export const handleWebhook = (
  options: MessengerBotOptions
): WebhookHandler<
  MessengerChannel,
  MessengerEvent,
  MessengerResponse
> => async (req: IncomingMessage, res: ServerResponse, rawBody?: string) => {
  const {
    shouldVerifyWebhook,
    verifyToken,
    shouldValidateRequest,
    appSecret,
  } = options;

  if (req.method === 'GET') {
    const query: { [string]: string } = (url.parse(req.url, true).query: any);

    if (!shouldVerifyWebhook) {
      endRes(res, 403);
    } else if (
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === verifyToken
    ) {
      endRes(res, 200, query['hub.challenge']);
    } else {
      endRes(res, 400);
    }

    return null;
  }

  if (req.method !== 'POST') {
    endRes(res, 405);
    return null;
  }

  if (!rawBody) {
    endRes(res, 400);
    return null;
  }

  if (shouldValidateRequest && appSecret !== undefined) {
    const hmac = crypto.createHmac('sha1', appSecret);

    hmac.update(rawBody, 'utf8');
    const computedSig = `sha1=${hmac.digest('hex')}`;

    if (req.headers['x-hub-signature'] !== computedSig) {
      endRes(res, 401);
      return null;
    }
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    endRes(res, 400);
    return null;
  }

  if (body.object !== 'page') {
    endRes(res, 404);
    return null;
  }

  const reports = [];

  let shouldWaitForRespond = false;

  for (const { messaging, stanby } of body.entry) {
    const isStandby = stanby !== undefined;
    const rawEvents = isStandby ? stanby : messaging;

    for (const rawEvent of rawEvents) {
      const event = createEvent(isStandby, rawEvent);
      const { type, payload } = event;

      const source =
        type === 'optin' && payload.sender === undefined
          ? { user_ref: payload.optin.user_ref }
          : payload.sender;

      const channel = new MessengerChannel(source, options.pageId);

      if (type === 'checkout_update' || type === 'pre_checkout') {
        shouldWaitForRespond = true;
      }

      reports.push({ event, channel, response: undefined });
    }
  }

  if (!shouldWaitForRespond) {
    endRes(res, 200);
  }

  return reports;
};

export const handleResponses = (): ResponsesHandler<
  MessengerChannel,
  MessengerEvent,
  MessengerResponse
> => async (req, res, reports) => {
  for (const { event, response } of reports) {
    const { type } = event;

    if (type === 'checkout_update' || type === 'pre_checkout') {
      if (typeof response === 'object') {
        endRes(res, 200, JSON.stringify(response));
      } else {
        endRes(res, 501);
      }

      return;
    }
  }

  endRes(res, 200);
};
