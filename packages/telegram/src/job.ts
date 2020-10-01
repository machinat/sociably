/** @internal */ /** */
import formatNode from '@machinat/core/utils/formatNode';
import type { DispatchableSegment } from '@machinat/core/engine/types';
import type { TelegramSegmentValue, TelegramJob } from './types';
import type { TelegramChat } from './channel';

export const createChatJob = (
  chat: TelegramChat,
  segments: DispatchableSegment<TelegramSegmentValue>[]
): TelegramJob[] => {
  const jobs: TelegramJob[] = [];

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      jobs.push({
        method: 'sendMessage',
        parameters: {
          chat_id: chat.id,
          text: segment.value,
          parse_mode: 'HTML',
        },
        executionKey: chat.uid,
        uploadingFiles: null,
      });
    } else {
      const { method, parameters, uploadingFiles } = segment.value;
      jobs.push({
        method,
        parameters: {
          ...parameters,
          chat_id: chat.id,
        },
        executionKey: chat.uid,
        uploadingFiles: uploadingFiles || null,
      });
    }
  });

  return jobs;
};

export const createUpdatingInlineMessageJobs = (
  _: null,
  segments: DispatchableSegment<TelegramSegmentValue>[]
): TelegramJob[] => {
  const jobs: TelegramJob[] = [];

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      throw new TypeError(
        'normal text not alowed when updating messages, use <EditText/>'
      );
    } else {
      const { method, parameters, uploadingFiles } = segment.value;

      if (!parameters.inline_message_id) {
        throw new TypeError(
          `no inlineMessageId provided on ${formatNode(segment.node)}`
        );
      }

      jobs.push({
        method,
        parameters,
        executionKey: undefined,
        uploadingFiles: uploadingFiles || null,
      });
    }
  });

  return jobs;
};
