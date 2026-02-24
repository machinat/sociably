import type { PopEventWrapper } from '@sociably/core';
import { MetaWebhookReceiver } from '@sociably/meta-api';
import { serviceProviderClass } from '@sociably/core/service';
import SenderP from './Sender.js';
import eventFactory from './event/factory.js';
import { ConfigsI, PlatformUtilitiesI } from './interface.js';
import { WHATSAPP } from './constant.js';
import type { WhatsAppEventContext } from './types.js';

type WhatsAppReceiverOptions = {
  sender: SenderP;
  popEventWrapper: PopEventWrapper<WhatsAppEventContext, null>;
  appSecret: string;
  webhookVerifyToken: string;
  shouldVerifyRequest?: boolean;
  shouldHandleChallenge?: boolean;
};

/**
 * WhatsAppReceiver receive and pop events from WhatsApp platform.
 *
 * @category Provider
 */
export class WhatsAppReceiver extends MetaWebhookReceiver<WhatsAppEventContext> {
  constructor({
    sender,
    appSecret,
    webhookVerifyToken,
    shouldHandleChallenge = true,
    shouldVerifyRequest = true,
    popEventWrapper,
  }: WhatsAppReceiverOptions) {
    super({
      appSecret,
      webhookVerifyToken,
      shouldHandleChallenge,
      shouldVerifyRequest,
      listeningPlatforms: [
        {
          platform: WHATSAPP,
          sender,
          objectType: 'whatsapp_business_account',
          makeEventsFromUpdate: eventFactory,
          popEvent: popEventWrapper(async () => null),
        },
      ],
    });
  }
}

const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConfigsI, SenderP, PlatformUtilitiesI],
  factory: (
    {
      shouldHandleChallenge,
      webhookVerifyToken,
      shouldVerifyRequest,
      appSecret,
    },
    sender,
    { popEventWrapper },
  ) =>
    new WhatsAppReceiver({
      sender,
      popEventWrapper,
      shouldHandleChallenge,
      webhookVerifyToken,
      shouldVerifyRequest,
      appSecret,
    }),
})(WhatsAppReceiver);

type ReceiverP = WhatsAppReceiver;
export default ReceiverP;
