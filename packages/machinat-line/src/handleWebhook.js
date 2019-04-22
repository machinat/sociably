// @flow
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

import createEvent from './event';

import type {
  LineBotOptions,
  LineWebhookRequestBody,
  LineEvent,
} from './types';

const endRes = (res, code, body) => {
  res.statusCode = code; // eslint-disable-line no-param-reassign
  res.end(body);
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

  const { useReplyAPI, shouldValidateRequest, channelSecret } = options;

  // NOTE: channelSecret is validated at bot 👇
  if (shouldValidateRequest /* :: && channelSecret */) {
    const signature = crypto
      .createHmac('SHA256', channelSecret)
      .update(rawBody)
      .digest('base64');

    if (req.headers['x-line-signature'] !== signature) {
      return endRes(res, 401);
    }
  }

  try {
    const { events: payloads } = (JSON.parse(rawBody): LineWebhookRequestBody);

    const events: LineEvent[] = new Array(payloads.length);

    for (let i = 0; i < events.length; i += 1) {
      events[i] = createEvent(payloads[i], useReplyAPI);
    }

    return events;
  } catch (e) {
    return endRes(res, 400);
  }
};

export default handleWebhook;
