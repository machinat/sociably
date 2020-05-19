// @flow
import crypto from 'crypto';
import invariant from 'invariant';
import { provider } from '@machinat/core/service';
import type { PopEventWrapper } from '@machinat/core/types';
import WebhookReceiver from '@machinat/http/webhook';
import type { WebhookHandler } from '@machinat/http/webhook/types';

import createEvent from './event';
import LineChannel from './channel';
import LineUser from './user';
import LineBot from './bot';
import { LINE } from './constant';
import { LINE_PLATFORM_CONFIGS_I, LINE_PLATFORM_MOUNTER_I } from './interface';
import type {
  LineWebhookRequestBody,
  LineEventContext,
  LinePlatformConfigs,
  LinePlatformMounter,
} from './types';

type LineReceiverOptions = {
  providerId: string,
  botChannelId: string,
  shouldValidateRequest?: boolean,
  channelSecret?: string,
};

const handleWebhook = (
  {
    providerId,
    botChannelId,
    shouldValidateRequest,
    channelSecret,
  }: LineReceiverOptions,
  bot: LineBot,
  popEventWrapper: PopEventWrapper<LineEventContext, null>
): WebhookHandler => {
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

    let parsedBody;
    try {
      parsedBody = (JSON.parse(body): LineWebhookRequestBody);
    } catch (e) {
      return { code: 400 };
    }

    const { events } = parsedBody;
    if (!events) {
      return { code: 400 };
    }

    const issuingEvents = [];

    for (const rawEvent of events) {
      const { source } = rawEvent;
      const channel = LineChannel.fromMessagingSource(
        providerId,
        botChannelId,
        source
      );
      const user = new LineUser(providerId, botChannelId, source.userId);
      const event = createEvent(rawEvent);

      issuingEvents.push(
        popEvent({
          platform: LINE,
          bot,
          channel,
          user,
          event,
          metadata,
        })
      );
    }

    await Promise.all(issuingEvents);
    return { code: 200 };
  };
};

class LineReceiver extends WebhookReceiver {
  constructor(
    {
      shouldValidateRequest = true,
      botChannelId,
      providerId,
      channelSecret,
    }: LineReceiverOptions,
    bot: LineBot,
    popEventWrapper: PopEventWrapper<LineEventContext, null>
  ) {
    invariant(
      !shouldValidateRequest || channelSecret,
      'should provide channelSecret if shouldValidateRequest set to true'
    );

    super(
      handleWebhook(
        { shouldValidateRequest, providerId, botChannelId, channelSecret },
        bot,
        popEventWrapper
      )
    );
  }
}

export default provider<LineReceiver>({
  lifetime: 'singleton',
  deps: [LINE_PLATFORM_CONFIGS_I, LineBot, LINE_PLATFORM_MOUNTER_I],
  factory: (
    configs: LinePlatformConfigs,
    bot: LineBot,
    { popEventWrapper }: LinePlatformMounter
  ) => new LineReceiver(configs, bot, popEventWrapper),
})(LineReceiver);
