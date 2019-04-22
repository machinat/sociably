// @flow
import url from 'url';
import crypto from 'crypto';

import type { IncomingMessage, ServerResponse } from 'http';

import createEvent from './event';

import type { MessengerBotOptions } from './types';

const eventReducer = (events, rawEventWrapper) => {
  const { messaging, stanby } = rawEventWrapper;
  const isStandby = stanby !== undefined;
  const payloads = isStandby ? stanby : messaging;

  for (let i = 0; i < payloads.length; i += 1) {
    events.push(createEvent(isStandby, payloads[i]));
  }

  return events;
};

const endRes = (res, code, body) => {
  res.statusCode = code; // eslint-disable-line no-param-reassign
  res.end(body);
  return undefined;
};

const handleWebhook = (options: MessengerBotOptions) => (
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
    return endRes(res, 405);
  }

  if (rawBody === undefined) {
    return endRes(res, 400);
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

    return body.entry.reduce(eventReducer, []);
  } catch (e) {
    return endRes(res, 400);
  }
};

export default handleWebhook;
