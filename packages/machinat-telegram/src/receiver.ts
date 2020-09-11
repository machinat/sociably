import { parse as parseURL } from 'url';
import crypto from 'crypto';
import invariant from 'invariant';

import WebhookReceiver from '@machinat/http/webhook';
import type { WebhookHandler } from '@machinat/http/webhook/types';
import { provider } from '@machinat/core/service';
import type { PopEventWrapper } from '@machinat/core/types';

import createEvent from './event';
import TelegramChannel from './channel';
import TelegramUser from './user';
import { BotP } from './bot';
import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { TELEGRAM } from './constant';
import type {
  TelegramEventContext,
  TelegramPlatformConfigs,
  TelegramPlatformMounter,
} from './types';

type TelegramReceiverOptions = {
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
  }: TelegramReceiverOptions,
  bot: BotP,
  popEventWrapper: PopEventWrapper<TelegramEventContext, null>
): WebhookHandler => {
  const popEvent = popEventWrapper(() => Promise.resolve(null));

  return async (metadata) => {
    const { method, url, headers, body: rawBody } = metadata.request;

    // handle webhook verification
    if (method === 'GET') {
      if (!shouldHandleVerify) {
        return { code: 403 };
      }

      const { query } = parseURL(url, true);
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
        const event = createEvent(isStandby, rawEvent);
        const { type, payload } = event;
        const { sender } = payload;

        const channel =
          type === 'optin' && sender === undefined
            ? new TelegramChannel(pageId, { user_ref: payload.optin.user_ref })
            : new TelegramChannel(pageId, sender);

        const user =
          sender !== undefined ? new TelegramUser(pageId, sender.id) : null;

        issuingEvents.push(
          popEvent({ platform: TELEGRAM, bot, channel, user, event, metadata })
        );
      }
    }

    await Promise.all(issuingEvents);
    return { code: 200 };
  };
};

/**
 * TelegramReceiver receive and pop events from Telegram platform.
 * @category Provider
 */
export class TelegramReceiver extends WebhookReceiver {
  constructor(
    {
      shouldHandleVerify = true,
      verifyToken,
      shouldValidateRequest = true,
      appSecret,
    }: TelegramReceiverOptions,
    bot: BotP,
    popEventWrapper: PopEventWrapper<TelegramEventContext, null>
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

export const ReceiverP = provider<TelegramReceiver>({
  lifetime: 'singleton',
  deps: [PLATFORM_CONFIGS_I, BotP, PLATFORM_MOUNTER_I],
  factory: (
    configs: TelegramPlatformConfigs,
    bot: BotP,
    { popEventWrapper }: TelegramPlatformMounter
  ) => new TelegramReceiver(configs, bot, popEventWrapper),
})(TelegramReceiver);

export type ReceiverP = TelegramReceiver;
