import type { DispatchableSegment } from '@sociably/core/engine';
import { getTimeId, formatNode } from '@sociably/core/utils';
import type { MetaApiJob } from '@sociably/meta-api';
import type WhatsAppChat from './Chat';
import type WhatsAppAgent from './Agent';
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
        channel: chat.agent,
        request: {
          method: 'POST',
          url: `${chat.agentNumberId}/messages`,
          params: {
            type: 'text',
            text: segment.value,
            to: chat.userNumberId,
            messaging_product: 'whatsapp',
          },
        },
      });
    } else {
      const { message, mediaFile } = segment.value;
      const mediaResultKey = mediaFile ? getTimeId() : undefined;

      if (mediaFile) {
        const {
          type: fileType,
          data: fileData,
          info: fileInfo,
          assetTag,
        } = mediaFile;

        jobs.push({
          key: chat.uid,
          channel: chat.agent,
          request: {
            method: 'POST',
            url: `${chat.agentNumberId}/media`,
            params: { type: fileType, messaging_product: 'whatsapp' },
          },
          file: { data: fileData, info: fileInfo, assetTag },
          registerResult: mediaResultKey,
        });
      }

      jobs.push({
        key: chat.uid,
        channel: chat.agent,
        request: {
          method: 'POST',
          url: `${chat.agentNumberId}/messages`,
          params: {
            ...message,
            to: chat.userNumberId,
            messaging_product: 'whatsapp',
          },
        },
        consumeResult: mediaResultKey
          ? {
              keys: [mediaResultKey],
              accomplishRequest: (request, [key], getValue) => {
                const params = request.params as Record<string, any>;
                return {
                  ...request,
                  params: {
                    ...params,
                    [params.type]: {
                      ...params[params.type],
                      id: getValue(key, '$.id'),
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

export const createUploadingMediaJobs = (
  agent: WhatsAppAgent,
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

  const {
    mediaFile: { type: fileType, data: fileData, info: fileInfo, assetTag },
  } = segments[0].value;
  return [
    {
      key: undefined,
      channel: agent,
      request: {
        method: 'POST',
        url: `${agent.numberId}/media`,
        params: { type: fileType, messaging_product: 'whatsapp' },
      },
      file: { data: fileData, info: fileInfo, assetTag },
    },
  ];
};
