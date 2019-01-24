// @flow
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

import createEvent from './event';

import type { LineBotOptions } from './types';

const endRes = (res, code, body) => {
  res.statusCode = code; // eslint-disable-line no-param-reassign
  res.end(body);
  return undefined;
};

const handleWebhook = (options: LineBotOptions) => (
  req: IncomingMessage,
  res: ServerResponse,
  rawBody: void | string
) => {
  if (req.method !== 'POST') {
    return endRes(res, 405);
  }

  if (rawBody === undefined) {
    return endRes(res, 400);
  }

  if (options.shouldValidateRequest) {
    const signature = crypto
      .createHmac('SHA256', options.channelSecret)
      .update(rawBody)
      .digest('base64');

    if (req.headers['x-line-signature'] !== signature) {
      return endRes(res, 401);
    }
  }

  let body;
  try {
    body = JSON.parse(rawBody);
    return body.events.map(createEvent);
  } catch (e) {
    return endRes(res, 400);
  }
};

export default handleWebhook;
