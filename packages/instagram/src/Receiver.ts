import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { serviceProviderClass } from '@sociably/core/service';
import BotP from './Bot.js';
import { ConfigsI, PlatformUtilitiesI } from './interface.js';
import createMetaReceiverListeningOptions from './utils/createMetaReceiverListeningOptions.js';
import type { InstagramEventContext } from './types.js';

type InstagramReceiverOptions = {
  bot: BotP;
  popEventWrapper: PopEventWrapper<InstagramEventContext, null>;
  appSecret: string;
  verifyToken: string;
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
    verifyToken,
    shouldHandleChallenge = true,
    shouldVerifyRequest = true,
    popEventWrapper,
  }: InstagramReceiverOptions) {
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
    new InstagramReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge,
      verifyToken,
      shouldVerifyRequest,
      appSecret,
    }),
})(InstagramReceiver);

type ReceiverP = InstagramReceiver;
export default ReceiverP;
