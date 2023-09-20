import TwitterChat from '../Chat.js';
import type { MediaAttachment, DirectMessageSegmentValue } from '../types.js';
import annotateDmMedia from './annotateDmMedia.js';

const createDmSegmentValue = (
  text?: string,
  media?: MediaAttachment,
): DirectMessageSegmentValue => ({
  type: 'dm',
  request: {
    method: 'POST',
    url: '1.1/direct_messages/events/new.json',
    params: {
      event: {
        type: 'message_create',
        message_create: {
          target: { recipient_id: '' },
          message_data: {
            text,
            attachment: media
              ? {
                  type: 'media',
                  media: { id: '' },
                }
              : undefined,
          },
        },
      },
    },
  },
  accomplishRequest: (target: TwitterChat, request, mediaResults) => {
    // eslint-disable-next-line no-param-reassign
    request.params.event.message_create.target.recipient_id = target.userId;

    if (mediaResults) {
      // eslint-disable-next-line no-param-reassign
      request.params.event.message_create.message_data.attachment.media.id =
        mediaResults[0];
    }
    return request;
  },
  mediaSources: media ? [annotateDmMedia(media.type, media.source)] : null,
});

export default createDmSegmentValue;
