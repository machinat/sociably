import crypto from 'crypto';
import invariant from 'invariant';
import { makeClassProvider } from '@machinat/core/service';
import type { PopEventWrapper } from '@machinat/core/types';
import WebhookReceiver from '@machinat/http/webhook';
import type { WebhookHandler } from '@machinat/http/webhook/types';

import eventFactory from './event/factory';
import { BotP } from './bot';
import { LINE } from './constant';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import type { LineWebhookRequestBody, LineEventContext } from './types';

type LineReceiverOptions = {
  providerId: string;
  channelId: string;
  shouldValidateRequest?: boolean;
  channelSecret?: string;
  bot: BotP;
  popEventWrapper: PopEventWrapper<LineEventContext, null>;
};

/** @internal */
const handleWebhook = ({
  bot,
  popEventWrapper,
  providerId,
  channelId,
  shouldValidateRequest,
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

    if (shouldValidateRequest && channelSecret !== undefined) {
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
    shouldValidateRequest = true,
    channelSecret,
  }: LineReceiverOptions) {
    invariant(providerId, 'configs.providerId should not be empty');
    invariant(channelId, 'configs.channelId should not be empty');
    invariant(
      !shouldValidateRequest || channelSecret,
      'should provide configs.channelSecret when shouldValidateRequest set to true'
    );
    super(
      handleWebhook({
        bot,
        popEventWrapper,
        providerId,
        channelId,
        shouldValidateRequest,
        channelSecret,
      })
    );
  }
}

export const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformUtilitiesI] as const,
  factory: (
    { providerId, channelId, shouldValidateRequest, channelSecret },
    bot,
    { popEventWrapper }
  ) =>
    new LineReceiver({
      bot,
      popEventWrapper,
      providerId,
      channelId,
      shouldValidateRequest,
      channelSecret,
    }),
})(LineReceiver);

export type ReceiverP = LineReceiver;
