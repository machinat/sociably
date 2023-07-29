import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { serviceProviderClass } from '@sociably/core/service';
import BotP from './Bot.js';
import { ConfigsI, PlatformUtilitiesI } from './interface.js';
import createMetaReceiverListeningOptions from './utils/createMetaReceiverListeningOptions.js';
import type { FacebookEventContext } from './types.js';

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
    shouldHandleChallenge = true,
    shouldVerifyRequest = true,
    popEventWrapper,
  }: FacebookReceiverOptions) {
    super({
      appSecret,
      verifyToken,
      shouldHandleChallenge,
      shouldVerifyRequest,
      listeningPlatforms: [
        createMetaReceiverListeningOptions(bot, popEventWrapper),
      ],
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
