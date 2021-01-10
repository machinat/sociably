import { parse as parseUrl } from 'url';
import { join as joinPath } from 'path';
import invariant from 'invariant';

import WebhookReceiver from '@machinat/http/webhook';
import type { WebhookHandler } from '@machinat/http/webhook/types';
import { makeClassProvider } from '@machinat/core/service';
import type { PopEventWrapper } from '@machinat/core/types';

import eventFactory from './event/factory';
import { BotP } from './bot';
import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { TELEGRAM } from './constant';
import type { TelegramEventContext, TelegramRawEvent } from './types';

type TelegramReceiverOptions = {
  botId: number;
  entryPath?: string;
  secretPath?: string;
};

/** @internal */
const handleWebhook = (
  { botId, secretPath, entryPath = '/' }: TelegramReceiverOptions,
  bot: BotP,
  popEventWrapper: PopEventWrapper<TelegramEventContext, null>
): WebhookHandler => {
  const popEvent = popEventWrapper(async () => null);
  const createEvent = eventFactory(botId);

  return async (metadata, routingInfo) => {
    const { method, url, body: rawBody } = metadata.request;

    // method not allowed
    if (method !== 'POST') {
      return { code: 405 };
    }

    if (!rawBody) {
      return { code: 400 };
    }

    // validate secret path
    if (secretPath) {
      if (routingInfo) {
        if (routingInfo.trailingPath !== secretPath) {
          return { code: 401 };
        }
      } else {
        const { pathname } = parseUrl(url);
        if (pathname !== joinPath(entryPath, secretPath)) {
          return { code: 401 };
        }
      }
    }

    let body: TelegramRawEvent;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return { code: 400 };
    }

    const event = createEvent(body);

    await popEvent({ platform: TELEGRAM, bot, event, metadata });
    return { code: 200 };
  };
};

/**
 * TelegramReceiver receive and pop events from Telegram platform.
 * @category Provider
 */
export class TelegramReceiver extends WebhookReceiver {
  constructor(
    options: TelegramReceiverOptions,
    bot: BotP,
    popEventWrapper: PopEventWrapper<TelegramEventContext, null>
  ) {
    invariant(options?.botId, 'options.botId should not be empty');

    super(handleWebhook(options, bot, popEventWrapper));
  }
}

export const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [PLATFORM_CONFIGS_I, BotP, PLATFORM_MOUNTER_I] as const,
  factory: ({ botToken, secretPath, entryPath }, bot, { popEventWrapper }) => {
    const botId = Number(botToken.split(':', 1)[0]);
    return new TelegramReceiver(
      { botId, secretPath, entryPath },
      bot,
      popEventWrapper
    );
  },
})(TelegramReceiver);

export type ReceiverP = TelegramReceiver;
