import { PopEventWrapper } from '@sociably/core';
import { ListeningPlatformOptions } from '@sociably/meta-api';
import WhatsAppBot from '../Bot.js';
import { WHATSAPP } from '../constant.js';
import eventFactory from '../event/factory.js';
import { WhatsAppEventContext } from '../types.js';

const createMetaReceiverListeningOptions = (
  bot: WhatsAppBot,
  popEventWrapper: PopEventWrapper<WhatsAppEventContext, null>
): ListeningPlatformOptions<WhatsAppEventContext> => ({
  platform: WHATSAPP,
  bot,
  objectType: 'whatsapp_business_account',
  makeEventsFromUpdate: eventFactory,
  popEvent: popEventWrapper(async () => null),
});

export default createMetaReceiverListeningOptions;
