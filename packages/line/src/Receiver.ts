import crypto from 'crypto';
import { SociablyNode } from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import type { PopEventWrapper } from '@sociably/core';
import { WebhookReceiver, WebhookHandler } from '@sociably/http/webhook';

import eventFactory from './event/factory';
import BotP from './Bot';
import { LINE } from './constant';
import {
  ConfigsI,
  PlatformUtilitiesI,
  ChannelSettingsAccessorI,
} from './interface';
import type {
  LineWebhookRequestBody,
  LineEventContext,
  LineEvent,
} from './types';

type LineReceiverOptions = {
  bot: BotP;
  channelSettingsAccessor: ChannelSettingsAccessorI;
  shouldVerifyRequest?: boolean;
  popEventWrapper: PopEventWrapper<LineEventContext, null>;
};

const replyClosure = (bot: BotP, event: LineEvent) => {
  let isReplyTokenUsed = false;
  return (message: SociablyNode) => {
    const shouldUseReplyToken = 'replyToken' in event && !isReplyTokenUsed;
    isReplyTokenUsed = true;

    return bot.render(event.thread, message, {
      replyToken: shouldUseReplyToken ? event.replyToken : undefined,
    });
  };
};

const handleWebhook = ({
  bot,
  channelSettingsAccessor,
  popEventWrapper,
  shouldVerifyRequest,
}: LineReceiverOptions): WebhookHandler => {
  const popEvent = popEventWrapper(() => Promise.resolve(null));

  return async (metadata) => {
    const {
      request: { method, body, headers },
    } = metadata;
    if (method !== 'POST') {
      return { code: 405 };
    }

    if (!body) {
      return { code: 400 };
    }

    let parsedBody: LineWebhookRequestBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      return { code: 400 };
    }

    const { destination, events } = parsedBody;
    if (!events) {
      return { code: 400 };
    }

    const settings =
      await channelSettingsAccessor.getLineChatChannelSettingsByBotUserId(
        destination
      );
    if (!settings) {
      return { code: 404 };
    }
    const { providerId, channelId, channelSecret } = settings;

    if (shouldVerifyRequest) {
      const signature = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');

      if (headers['x-line-signature'] !== signature) {
        return { code: 401 };
      }
    }

    const issuingEvents: Promise<null>[] = [];

    for (const rawEvent of events) {
      const event = eventFactory(providerId, channelId, rawEvent);

      issuingEvents.push(
        popEvent({
          platform: LINE,
          bot,
          event,
          metadata,
          reply: replyClosure(bot, event),
        })
      );
    }

    await Promise.all(issuingEvents);
    return { code: 200 };
  };
};

/**
 * @category Provider
 */
export class LineReceiver extends WebhookReceiver {
  constructor({
    bot,
    channelSettingsAccessor,
    popEventWrapper,
    shouldVerifyRequest = true,
  }: LineReceiverOptions) {
    super(
      handleWebhook({
        bot,
        channelSettingsAccessor,
        popEventWrapper,
        shouldVerifyRequest,
      })
    );
  }
}

const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, ChannelSettingsAccessorI, PlatformUtilitiesI],
  factory: (
    { shouldVerifyRequest },
    bot,
    channelSettingsAccessor,
    { popEventWrapper }
  ) =>
    new LineReceiver({
      bot,
      channelSettingsAccessor,
      popEventWrapper,
      shouldVerifyRequest,
    }),
})(LineReceiver);

type ReceiverP = LineReceiver;

export default ReceiverP;
