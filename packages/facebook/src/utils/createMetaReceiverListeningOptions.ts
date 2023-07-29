import { PopEventWrapper } from '@sociably/core';
import { ListeningPlatformOptions } from '@sociably/meta-api';
import FacebookBot from '../Bot.js';
import { FACEBOOK } from '../constant.js';
import eventFactory from '../event/factory.js';
import { FacebookEventContext } from '../types.js';

const createMetaReceiverListeningOptions = (
  bot: FacebookBot,
  popEventWrapper: PopEventWrapper<FacebookEventContext, null>
): ListeningPlatformOptions<FacebookEventContext> => ({
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
  popEvent: popEventWrapper(async () => null),
});

export default createMetaReceiverListeningOptions;
