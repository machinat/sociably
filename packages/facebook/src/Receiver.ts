import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { serviceProviderClass } from '@sociably/core/service';
import eventFactory from './event/factory';
import BotP from './Bot';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { FACEBOOK } from './constant';
import type { FacebookEventContext } from './types';

type FacebookReceiverOptions = {
  bot: BotP;
  popEventWrapper: PopEventWrapper<FacebookEventContext, null>;
  appSecret: string;
  verifyToken: string;
  shouldVerifyRequest?: boolean;
  shouldHandleChallenge?: boolean;
};

/**
 * FacebookReceiver receive and pop events from Facebook platform.
 * @category Provider
 */
export class FacebookReceiver extends MetaWebhookReceiver<FacebookEventContext> {
  constructor({
    bot,
    appSecret,
    verifyToken,
    shouldHandleChallenge,
    shouldVerifyRequest,
    popEventWrapper,
  }: FacebookReceiverOptions) {
    super({
      platform: FACEBOOK,
      bot,
      objectType: 'page',
      makeEventsFromUpdate: (updateData) => {
        const { id: pageId, messaging, stanby } = updateData;
        const isStandby = stanby !== undefined;
        const rawEvents = isStandby ? stanby : messaging;

        return rawEvents.map((rawEvent) =>
          eventFactory(pageId, isStandby, rawEvent)
        );
      },
      popEventWrapper,
      shouldHandleChallenge,
      verifyToken,
      shouldVerifyRequest,
      appSecret,
    });
  }
}

const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformUtilitiesI],
  factory: (
    { shouldHandleChallenge, verifyToken, shouldVerifyRequest, appSecret },
    bot,
    { popEventWrapper }
  ) =>
    new FacebookReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge,
      verifyToken,
      shouldVerifyRequest,
      appSecret,
    }),
})(FacebookReceiver);

type ReceiverP = FacebookReceiver;
export default ReceiverP;
