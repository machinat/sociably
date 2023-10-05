import type { DispatchableSegment } from '@sociably/core/engine';
import { getTimeId, formatNode } from '@sociably/core/utils';
import type { MetaApiJob } from '@sociably/meta-api';
import type WhatsAppChat from './Chat.js';
import type WhatsAppAgent from './Agent.js';
import { WhatsAppSegmentValue } from './types.js';

export const createChatJobs = (
  chat: WhatsAppChat,
  segments: DispatchableSegment<WhatsAppSegmentValue>[],
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
            text: { body: segment.value },
            to: chat.userNumberId,
            messaging_product: 'whatsapp',
          },
        },
      });
    } else {
      const { message, file, assetTag } = segment.value;
      const mediaResultKey = file ? getTimeId() : undefined;

      if (file) {
        jobs.push({
          key: chat.uid,
          channel: chat.agent,
          request: {
            method: 'POST',
            url: `${chat.agentNumberId}/media`,
            params: {
              type: file.contentType,
              messaging_product: 'whatsapp',
            },
          },
          file,
          assetTag,
          registerResultKey: mediaResultKey,
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
  segments: DispatchableSegment<WhatsAppSegmentValue>[],
): MetaApiJob[] => {
  if (segments.length !== 1) {
    throw new TypeError('there should be only one media to be uploaded');
  }
  if (segments[0].type === 'text' || !segments[0].value.file) {
    throw new TypeError(
      `${formatNode(segments[0].node, true)} is not a media with file data`,
    );
  }

  const { file, assetTag } = segments[0].value;
  return [
    {
      key: undefined,
      channel: agent,
      request: {
        method: 'POST',
        url: `${agent.id}/media`,
        params: { type: file?.contentType, messaging_product: 'whatsapp' },
      },
      file,
      assetTag,
    },
  ];
};
