import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { makeClassProvider } from '@sociably/core/service';
import eventFactory from './event/factory';
import BotP from './Bot';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { MESSENGER } from './constant';
import type { MessengerEventContext } from './types';

type MessengerReceiverOptions = {
  bot: BotP;
  popEventWrapper: PopEventWrapper<MessengerEventContext, null>;
  appSecret?: string;
  shouldVerifyRequest?: boolean;
  shouldHandleChallenge?: boolean;
  verifyToken?: string;
};

/**
 * MessengerReceiver receive and pop events from Messenger platform.
 * @category Provider
 */
export class MessengerReceiver extends MetaWebhookReceiver<MessengerEventContext> {
  constructor({
    bot,
    appSecret,
    verifyToken,
    shouldHandleChallenge,
    shouldVerifyRequest,
    popEventWrapper,
  }: MessengerReceiverOptions) {
    super({
      platform: MESSENGER,
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

const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformUtilitiesI],
  factory: (
    { shouldHandleChallenge, verifyToken, shouldVerifyRequest, appSecret },
    bot,
    { popEventWrapper }
  ) =>
    new MessengerReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge,
      verifyToken,
      shouldVerifyRequest,
      appSecret,
    }),
})(MessengerReceiver);

type ReceiverP = MessengerReceiver;
export default ReceiverP;
