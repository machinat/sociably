import { PopEventWrapper } from '@sociably/core';
import { ListeningPlatformOptions } from '@sociably/meta-api';
import InstagramBot from '../Bot.js';
import { INSTAGRAM } from '../constant.js';
import eventFactory from '../event/factory.js';
import { InstagramEventContext } from '../types.js';

const createMetaReceiverListeningOptions = (
  bot: InstagramBot,
  popEventWrapper: PopEventWrapper<InstagramEventContext, null>
): ListeningPlatformOptions<InstagramEventContext> => ({
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
});

export default createMetaReceiverListeningOptions;
