// @flow
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import type {
  WebhookHandler,
  WebhookEventReport,
} from 'machinat-webhook-receiver/types';

import createEvent from './event';
import LineChannel from './channel';

import type {
  LineBotOptions,
  LineWebhookRequestBody,
  LineEvent,
  LineRawEvent,
} from './types';

const endRes = (res, code, body) => {
  res.statusCode = code; // eslint-disable-line no-param-reassign
  res.end(body);
};

const handleWebhook = (
  options: LineBotOptions
): WebhookHandler<LineChannel, LineEvent, void> => {
  const { shouldValidateRequest, channelSecret, channelId } = options;

  const createEventReport = (
    rawEvent: LineRawEvent
  ): WebhookEventReport<LineChannel, LineEvent, void> => {
    return {
      event: createEvent(rawEvent),
      channel: new LineChannel(rawEvent.source, channelId),
      response: undefined,
    };
  };

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    rawBody?: string
  ) => {
    if (req.method !== 'POST') {
      endRes(res, 405);
      return null;
    }

    if (!rawBody) {
      endRes(res, 400);
      return null;
    }

    if (shouldValidateRequest && channelSecret !== undefined) {
      const signature = crypto
        .createHmac('SHA256', channelSecret)
        .update(rawBody)
        .digest('base64');

      if (req.headers['x-line-signature'] !== signature) {
        endRes(res, 401);
        return null;
      }
    }

    let body: LineWebhookRequestBody;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      endRes(res, 400);
      return null;
    }

    const { events } = body;
    if (!events) {
      endRes(res, 400);
      return null;
    }

    const reports = events.map(createEventReport);
    endRes(res, 200);
    return reports;
  };
};

export default handleWebhook;
