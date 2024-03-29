import { parse as parseUrl } from 'url';
import { posix as posixPath } from 'path';
import type { PopEventWrapper } from '@sociably/core';
import { WebhookReceiver } from '@sociably/http/webhook';
import type { WebhookHandler } from '@sociably/http/webhook';
import { serviceProviderClass } from '@sociably/core/service';
import createEvent from './event/factory.js';
import BotP from './Bot.js';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import TelegramUser from './User.js';
import { TELEGRAM } from './constant.js';
import type { TelegramEventContext, TelegramRawEvent } from './types.js';

type TelegramReceiverOptions = {
  bot: BotP;
  agentSettingsAccessor: AgentSettingsAccessorI;
  popEventWrapper: PopEventWrapper<TelegramEventContext, null>;
  shouldVerifySecretToken?: boolean;
  webhookPath?: string;
};

const handleWebhook = ({
  bot,
  popEventWrapper,
  agentSettingsAccessor,
  shouldVerifySecretToken = true,
  webhookPath = '/',
}: TelegramReceiverOptions): WebhookHandler => {
  const popEvent = popEventWrapper(async () => null);

  return async (metadata, routingInfo) => {
    const { method, url, body: rawBody, headers } = metadata.request;

    // method not allowed
    if (method !== 'POST') {
      return { code: 405 };
    }

    if (!rawBody) {
      return { code: 400 };
    }

    let trailingPath = routingInfo?.trailingPath;
    if (!trailingPath) {
      const { pathname } = parseUrl(url);
      trailingPath = posixPath.relative(
        posixPath.join('/', webhookPath),
        posixPath.normalize(pathname as string)
      );

      if (trailingPath === '' || trailingPath[0] === '.') {
        return { code: 404 };
      }
    }

    const botId = parseInt(trailingPath, 10);
    if (Number.isNaN(botId)) {
      return { code: 404 };
    }

    const agentSettings = await agentSettingsAccessor.getAgentSettings(
      new TelegramUser(botId, true)
    );
    if (!agentSettings) {
      return { code: 404 };
    }

    // validate secret token header
    if (
      shouldVerifySecretToken &&
      headers['x-telegram-bot-api-secret-token'] !== agentSettings.secretToken
    ) {
      return { code: 401 };
    }

    let body: TelegramRawEvent;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return { code: 400 };
    }

    const event = createEvent(botId, body);
    await popEvent({
      platform: TELEGRAM,
      bot,
      event,
      metadata,
      reply: (message) => {
        return bot.render(event.thread ?? event.channel, message);
      },
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
    super(handleWebhook(options));
  }
}

const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, AgentSettingsAccessorI, PlatformUtilitiesI],
  factory: (
    { webhookPath, shouldVerifySecretToken },
    bot,
    agentSettingsAccessor,
    { popEventWrapper }
  ) => {
    return new TelegramReceiver({
      bot,
      webhookPath,
      agentSettingsAccessor,
      shouldVerifySecretToken,
      popEventWrapper,
    });
  },
})(TelegramReceiver);

type ReceiverP = TelegramReceiver;
export default ReceiverP;
