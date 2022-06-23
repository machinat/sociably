import crypto from 'crypto';
import invariant from 'invariant';
import { makeClassProvider } from '@sociably/core/service';
import type { PopEventWrapper } from '@sociably/core';
import { WebhookReceiver, WebhookHandler } from '@sociably/http/webhook';

import eventFactory from './event/factory';
import BotP from './Bot';
import { LINE } from './constant';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import type { LineWebhookRequestBody, LineEventContext } from './types';

type LineReceiverOptions = {
  providerId: string;
  channelId: string;
  shouldVerifyRequest?: boolean;
  channelSecret?: string;
  bot: BotP;
  popEventWrapper: PopEventWrapper<LineEventContext, null>;
};

const handleWebhook = ({
  bot,
  popEventWrapper,
  providerId,
  channelId,
  shouldVerifyRequest,
  channelSecret,
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

    if (shouldVerifyRequest && channelSecret !== undefined) {
      const signature = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');

      if (headers['x-line-signature'] !== signature) {
        return { code: 401 };
      }
    }

    let parsedBody: LineWebhookRequestBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      return { code: 400 };
    }

    const { events } = parsedBody;
    if (!events) {
      return { code: 400 };
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
          reply: (message) =>
            bot.render(event.channel, message, {
              replyToken: 'replyToken' in event ? event.replyToken : undefined,
            }),
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
    popEventWrapper,
    providerId,
    channelId,
    shouldVerifyRequest = true,
    channelSecret,
  }: LineReceiverOptions) {
    invariant(providerId, 'configs.providerId should not be empty');
    invariant(channelId, 'configs.channelId should not be empty');
    invariant(
      !shouldVerifyRequest || channelSecret,
      'should provide configs.channelSecret when shouldVerifyRequest set to true'
    );
    super(
      handleWebhook({
        bot,
        popEventWrapper,
        providerId,
        channelId,
        shouldVerifyRequest,
        channelSecret,
      })
    );
  }
}

const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformUtilitiesI],
  factory: (
    { providerId, channelId, shouldVerifyRequest, channelSecret },
    bot,
    { popEventWrapper }
  ) =>
    new LineReceiver({
      bot,
      popEventWrapper,
      providerId,
      channelId,
      shouldVerifyRequest,
      channelSecret,
    }),
})(LineReceiver);

type ReceiverP = LineReceiver;

export default ReceiverP;
