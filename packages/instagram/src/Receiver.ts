import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { serviceProviderClass } from '@sociably/core/service';
import BotP from './Bot.js';
import eventFactory from './event/factory.js';
import { ConfigsI, PlatformUtilitiesI } from './interface.js';
import { INSTAGRAM } from './constant.js';
import type { InstagramEventContext } from './types.js';

type InstagramReceiverOptions = {
  bot: BotP;
  popEventWrapper: PopEventWrapper<InstagramEventContext, null>;
  appSecret: string;
  webhookVerifyToken: string;
  shouldVerifyRequest?: boolean;
  shouldHandleChallenge?: boolean;
};

/**
 * InstagramReceiver receive and pop events from Meta webhook.
 * @category Provider
 */
export class InstagramReceiver extends MetaWebhookReceiver<InstagramEventContext> {
  constructor({
    bot,
    appSecret,
    webhookVerifyToken,
    shouldHandleChallenge = true,
    shouldVerifyRequest = true,
    popEventWrapper,
  }: InstagramReceiverOptions) {
    super({
      appSecret,
      webhookVerifyToken,
      shouldHandleChallenge,
      shouldVerifyRequest,
      listeningPlatforms: [
        {
          platform: INSTAGRAM,
          bot,
          objectType: 'instagram',
          makeEventsFromUpdate: (updateData) => {
            const { id: pageId, messaging, stanby } = updateData;
            const isStandby = stanby !== undefined;
            const rawEvents = isStandby ? stanby : messaging;

            return rawEvents.map((rawEvent) =>
              eventFactory(pageId, isStandby, rawEvent)
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
    { popEventWrapper }
  ) =>
    new InstagramReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge,
      webhookVerifyToken,
      shouldVerifyRequest,
      appSecret,
    }),
})(InstagramReceiver);

type ReceiverP = InstagramReceiver;
export default ReceiverP;
