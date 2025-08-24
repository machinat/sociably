import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { serviceProviderClass } from '@sociably/core/service';
import BotP from './Bot.js';
import eventFactory from './event/factory.js';
import { ConfigsI, PlatformUtilitiesI } from './interface.js';
import { FACEBOOK } from './constant.js';
import type { FacebookEventContext } from './types.js';

type FacebookReceiverOptions = {
  bot: BotP;
  popEventWrapper: PopEventWrapper<FacebookEventContext, null>;
  appSecret: string;
  webhookVerifyToken: string;
  shouldVerifyRequest?: boolean;
  shouldHandleChallenge?: boolean;
};

/**
 * FacebookReceiver receive and pop events from Facebook platform.
 *
 * @category Provider
 */
export class FacebookReceiver extends MetaWebhookReceiver<FacebookEventContext> {
  constructor({
    bot,
    appSecret,
    webhookVerifyToken,
    shouldHandleChallenge = true,
    shouldVerifyRequest = true,
    popEventWrapper,
  }: FacebookReceiverOptions) {
    super({
      appSecret,
      webhookVerifyToken,
      shouldHandleChallenge,
      shouldVerifyRequest,
      listeningPlatforms: [
        {
          platform: FACEBOOK,
          bot,
          objectType: 'page',
          makeEventsFromUpdate: (updateData) => {
            const { id: pageId, messaging, stanby } = updateData;
            const isStandby = stanby !== undefined;
            const rawEvents = isStandby ? stanby : messaging;

            return rawEvents.map((rawEvent) =>
              eventFactory(pageId, isStandby, rawEvent),
            );
          },
          popEvent: popEventWrapper(async () => null),
        },
      ],
    });
  }
}

const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformUtilitiesI],
  factory: (
    {
      shouldHandleChallenge,
      webhookVerifyToken,
      shouldVerifyRequest,
      appSecret,
    },
    bot,
    { popEventWrapper },
  ) =>
    new FacebookReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge,
      webhookVerifyToken,
      shouldVerifyRequest,
      appSecret,
    }),
})(FacebookReceiver);

type ReceiverP = FacebookReceiver;
export default ReceiverP;
