import { parse as parseURL } from 'url';
import { basename } from 'path';

import WebhookReceiver from '@machinat/http/webhook';
import type { WebhookHandler } from '@machinat/http/webhook/types';
import { provider } from '@machinat/core/service';
import type { PopEventWrapper } from '@machinat/core/types';

import createEvent from './event/factory';
import { BotP } from './bot';
import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import { TELEGRAM } from './constant';
import type {
  TelegramEventContext,
  TelegramPlatformConfigs,
  TelegramPlatformMounter,
  TelegramRawEvent,
} from './types';

type TelegramReceiverOptions = {
  secretPath?: string;
};

/** @internal */
const handleWebhook = (
  { secretPath }: TelegramReceiverOptions,
  bot: BotP,
  popEventWrapper: PopEventWrapper<TelegramEventContext, null>
): WebhookHandler => {
  const popEvent = popEventWrapper(async () => null);

  return async (metadata) => {
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
      const { pathname } = parseURL(url);

      if (!pathname || basename(pathname) !== secretPath) {
        return { code: 401 };
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
    { secretPath }: TelegramReceiverOptions,
    bot: BotP,
    popEventWrapper: PopEventWrapper<TelegramEventContext, null>
  ) {
    super(handleWebhook({ secretPath }, bot, popEventWrapper));
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
