import type { DispatchableSegment } from '@sociably/core/engine';
import { getTimeId, formatNode } from '@sociably/core/utils';
import type { MetaApiJob } from '@sociably/meta-api';
import type WhatsAppChat from './Chat';
import { WhatsAppSegmentValue } from './types';

export const createChatJobs = (
  chat: WhatsAppChat,
  segments: DispatchableSegment<WhatsAppSegmentValue>[]
): MetaApiJob[] => {
  const jobs: MetaApiJob[] = [];

  for (const segment of segments) {
    if (segment.type === 'text') {
      jobs.push({
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: `${chat.businessNumber}/messages`,
          body: {
            type: 'text',
            text: segment.value,
            to: chat.customerNumber,
            messaging_product: 'whatsapp',
          },
        },
      });
    } else {
      const { message, mediaFile } = segment.value;
      const mediaResultKey = mediaFile ? getTimeId() : undefined;

      if (mediaFile) {
        jobs.push({
          key: chat.uid,
          request: {
            method: 'POST',
            relative_url: `${chat.businessNumber}/media`,
            body: {
              type: mediaFile.type,
              messaging_product: 'whatsapp',
            },
          },
          fileData: mediaFile.data,
          fileInfo: mediaFile.info,
          assetTag: mediaFile.assetTag,
          registerResult: mediaResultKey,
        });
      }

      jobs.push({
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: `${chat.businessNumber}/messages`,
          body: {
            ...message,
            to: chat.customerNumber,
            messaging_product: 'whatsapp',
          },
        },
        consumeResult: mediaResultKey
          ? {
              key: mediaResultKey,
              accomplishRequest: (request, getValue) => {
                const body = request.body as Record<string, any>;
                return {
                  ...request,
                  body: {
                    ...body,
                    [body.type]: {
                      ...body[body.type],
                      id: getValue('$.id'),
                    },
                  },
                };
              },
            }
          : undefined,
      });
    }
  }

  return jobs;
};

export const createUploadingMediaJobs =
  (businessNumber: string) =>
  (
    _: null,
    segments: DispatchableSegment<WhatsAppSegmentValue>[]
  ): MetaApiJob[] => {
    if (segments.length !== 1) {
      throw new TypeError('there should be only one media to be uploaded');
    }
    if (segments[0].type === 'text' || !segments[0].value.mediaFile) {
      throw new TypeError(
        `${formatNode(segments[0].node, true)} is not a media with file data`
      );
    }

    const { mediaFile } = segments[0].value;
    return [
      {
        key: undefined,
        request: {
          method: 'POST',
          relative_url: `${businessNumber}/media`,
          body: {
            type: mediaFile.type,
            messaging_product: 'whatsapp',
          },
        },
        fileData: mediaFile.data,
        fileInfo: mediaFile.info,
        assetTag: mediaFile.assetTag,
      },
    ];
  };
