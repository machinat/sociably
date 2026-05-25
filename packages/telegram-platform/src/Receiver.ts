import type { PopEventWrapper } from '@sociably/core';
import { WebhookReceiver } from '@sociably/http/webhook';
import type { WebhookHandler } from '@sociably/http/webhook';
import { serviceProviderClass } from '@sociably/core/service';
import createEvent from './event/factory.js';
import SenderP from './Sender.js';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import TelegramUser from './User.js';
import { TELEGRAM } from './constant.js';
import type { TelegramEventContext, TelegramRawEvent } from './types.js';

type TelegramReceiverOptions = {
  sender: SenderP;
  agentSettingsAccessor: AgentSettingsAccessorI;
  secretToken: string;
  shouldVerifySecretToken?: boolean;
  popEventWrapper: PopEventWrapper<TelegramEventContext, null>;
};

const handleWebhook = ({
  sender,
  agentSettingsAccessor,
  secretToken,
  shouldVerifySecretToken = true,
  popEventWrapper,
}: TelegramReceiverOptions): WebhookHandler => {
  const popEvent = popEventWrapper(async () => null);

  return async (metadata, { trailingPath }) => {
    const { method, body: rawBody, headers } = metadata.request;

    // method not allowed
    if (method !== 'POST') {
      return { code: 405 };
    }

    if (!rawBody) {
      return { code: 400 };
    }

    const botId = parseInt(trailingPath, 10);
    if (Number.isNaN(botId)) {
      return { code: 404 };
    }

    const agentSettings = await agentSettingsAccessor.getAgentSettings(
      new TelegramUser(botId, true),
    );
    if (!agentSettings) {
      return { code: 404 };
    }

    // validate secret token header
    if (
      shouldVerifySecretToken &&
      headers['x-telegram-sender-api-secret-token'] !== secretToken
    ) {
      return { code: 401 };
    }

    let body: TelegramRawEvent;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { code: 400 };
    }

    const event = createEvent(botId, body);
    await popEvent({
      platform: TELEGRAM,
      sender,
      event,
      metadata,
      reply: (message) => sender.render(event.thread ?? event.agent, message),
    });
    return { code: 200 };
  };
};

/**
 * TelegramReceiver receive and pop events from Telegram platform.
 *
 * @category Provider
 */
export class TelegramReceiver extends WebhookReceiver {
  constructor(options: TelegramReceiverOptions) {
    super(handleWebhook(options));
  }
}

const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConfigsI, SenderP, AgentSettingsAccessorI, PlatformUtilitiesI],
  factory: (
    { secretToken, shouldVerifySecretToken },
    sender,
    agentSettingsAccessor,
    { popEventWrapper },
  ) =>
    new TelegramReceiver({
      sender,
      secretToken,
      agentSettingsAccessor,
      shouldVerifySecretToken,
      popEventWrapper,
    }),
})(TelegramReceiver);

type ReceiverP = TelegramReceiver;
export default ReceiverP;
