import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { makeClassProvider } from '@sociably/core/service';
import eventFactory from './event/factory';
import BotP from './Bot';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { WHATSAPP } from './constant';
import type { WhatsAppEventContext } from './types';

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

const ReceiverP = makeClassProvider({
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
