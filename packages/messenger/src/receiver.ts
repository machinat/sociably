import { parse as parseUrl } from 'url';
import crypto from 'crypto';
import invariant from 'invariant';

import WebhookReceiver from '@machinat/http/webhook';
import type { WebhookHandler } from '@machinat/http/webhook/types';
import { makeClassProvider } from '@machinat/core/service';
import type { PopEventWrapper } from '@machinat/core/types';

import eventFactory from './event/factory';
import { BotP } from './bot';
import { ConfigsI, PlatformMounterI } from './interface';
import { MESSENGER } from './constant';
import type { MessengerEventContext } from './types';

type MessengerReceiverOptions = {
  appSecret?: string;
  shouldValidateRequest?: boolean;
  shouldHandleVerify?: boolean;
  verifyToken?: string;
};

/** @internal */
const handleWebhook = (
  {
    shouldHandleVerify,
    verifyToken,
    shouldValidateRequest,
    appSecret,
  }: MessengerReceiverOptions,
  bot: BotP,
  popEventWrapper: PopEventWrapper<MessengerEventContext, null>
): WebhookHandler => {
  const popEvent = popEventWrapper(() => Promise.resolve(null));

  return async (metadata) => {
    const { method, url, headers, body: rawBody } = metadata.request;

    // handle webhook verification
    if (method === 'GET') {
      if (!shouldHandleVerify) {
        return { code: 403 };
      }

      const { query } = parseUrl(url, true);
      if (
        query['hub.mode'] !== 'subscribe' ||
        query['hub.verify_token'] !== verifyToken
      ) {
        return { code: 400 };
      }

      return { code: 200, body: query['hub.challenge'] };
    }

    // method not allowed
    if (method !== 'POST') {
      return { code: 405 };
    }

    if (!rawBody) {
      return { code: 400 };
    }

    // validate request signature
    if (shouldValidateRequest && appSecret !== undefined) {
      const hmac = crypto.createHmac('sha1', appSecret);

      hmac.update(rawBody, 'utf8');
      const computedSig = `sha1=${hmac.digest('hex')}`;

      if (headers['x-hub-signature'] !== computedSig) {
        return { code: 401 };
      }
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return { code: 400 };
    }

    if (body.object !== 'page') {
      return { code: 404 };
    }

    const issuingEvents: Promise<null>[] = [];

    // parse and pop event context
    for (const { id: pageId, messaging, stanby } of body.entry) {
      const isStandby = stanby !== undefined;
      const rawEvents = isStandby ? stanby : messaging;

      for (const rawEvent of rawEvents) {
        const event = eventFactory(pageId, isStandby, rawEvent);

        issuingEvents.push(
          popEvent({ platform: MESSENGER, bot, event, metadata })
        );
      }
    }

    await Promise.all(issuingEvents);
    return { code: 200 };
  };
};

/**
 * MessengerReceiver receive and pop events from Messenger platform.
 * @category Provider
 */
export class MessengerReceiver extends WebhookReceiver {
  constructor(
    {
      shouldHandleVerify = true,
      verifyToken,
      shouldValidateRequest = true,
      appSecret,
    }: MessengerReceiverOptions,
    bot: BotP,
    popEventWrapper: PopEventWrapper<MessengerEventContext, null>
  ) {
    invariant(
      !shouldValidateRequest || appSecret,
      'appSecret should not be empty if shouldValidateRequest set to true'
    );

    invariant(
      !shouldHandleVerify || verifyToken,
      'verifyToken should not be empty if shouldHandleVerify set to true'
    );

    super(
      handleWebhook(
        {
          shouldHandleVerify,
          verifyToken,
          shouldValidateRequest,
          appSecret,
        },
        bot,
        popEventWrapper
      )
    );
  }
}

export const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformMounterI] as const,
  factory: (configs, bot, { popEventWrapper }) =>
    new MessengerReceiver(configs, bot, popEventWrapper),
})(MessengerReceiver);

export type ReceiverP = MessengerReceiver;
