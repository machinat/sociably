import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { serviceProviderClass } from '@sociably/core/service';
import eventFactory from './event/factory.js';
import BotP from './Bot.js';
import { ConfigsI, PlatformUtilitiesI } from './interface.js';
import { WHATSAPP } from './constant.js';
import type { WhatsAppEventContext } from './types.js';

type WhatsAppReceiverOptions = {
  bot: BotP;
  popEventWrapper: PopEventWrapper<WhatsAppEventContext, null>;
  appSecret: string;
  verifyToken: string;
  shouldVerifyRequest?: boolean;
  shouldHandleChallenge?: boolean;
};

/**
 * WhatsAppReceiver receive and pop events from WhatsApp platform.
 * @category Provider
 */
export class WhatsAppReceiver extends MetaWebhookReceiver<WhatsAppEventContext> {
  constructor({
    bot,
    appSecret,
    verifyToken,
    shouldHandleChallenge,
    shouldVerifyRequest,
    popEventWrapper,
  }: WhatsAppReceiverOptions) {
    super({
      platform: WHATSAPP,
      bot,
      objectType: 'whatsapp_business_account',
      makeEventsFromUpdate: eventFactory,
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
    new WhatsAppReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge,
      verifyToken,
      shouldVerifyRequest,
      appSecret,
    }),
})(WhatsAppReceiver);

type ReceiverP = WhatsAppReceiver;
export default ReceiverP;
