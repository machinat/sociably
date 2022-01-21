import { parse as parseUrl } from 'url';
import { join as joinPath } from 'path';
import invariant from 'invariant';

import type { PopEventWrapper } from '@machinat/core';
import { WebhookReceiver } from '@machinat/http/webhook';
import type { WebhookHandler } from '@machinat/http/webhook';
import { makeClassProvider } from '@machinat/core/service';

import eventFactory from './event/factory';
import BotP from './Bot';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { TELEGRAM } from './constant';
import type { TelegramEventContext, TelegramRawEvent } from './types';

type TelegramReceiverOptions = {
  bot: BotP;
  popEventWrapper: PopEventWrapper<TelegramEventContext, null>;
  botId: number;
  webhookPath?: string;
  secretPath?: string;
};

const handleWebhook = ({
  bot,
  popEventWrapper,
  botId,
  secretPath,
  webhookPath = '/',
}: TelegramReceiverOptions): WebhookHandler => {
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
        if (pathname !== joinPath(webhookPath, secretPath)) {
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

    await popEvent({
      platform: TELEGRAM,
      bot,
      event,
      metadata,
      reply: (message) =>
        event.channel
          ? bot.render(event.channel, message)
          : Promise.resolve(null),
    });
    return { code: 200 };
  };
};

/**
 * TelegramReceiver receive and pop events from Telegram platform.
 * @category Provider
 */
export class TelegramReceiver extends WebhookReceiver {
  constructor(options: TelegramReceiverOptions) {
    invariant(options?.botId, 'options.botId should not be empty');
    super(handleWebhook(options));
  }
}

const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformUtilitiesI] as const,
  factory: (
    { botToken, secretPath, webhookPath },
    bot,
    { popEventWrapper }
  ) => {
    const botId = Number(botToken.split(':', 1)[0]);
    return new TelegramReceiver({
      bot,
      popEventWrapper,
      botId,
      secretPath,
      webhookPath,
    });
  },
})(TelegramReceiver);

type ReceiverP = TelegramReceiver;
export default ReceiverP;
