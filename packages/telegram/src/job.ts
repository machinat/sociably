import { formatNode } from '@machinat/core/utils';
import type { DispatchableSegment } from '@machinat/core/engine';
import type { TelegramSegmentValue, TelegramJob } from './types';
import type { TelegramChat, TelegramChatTarget } from './channel';

export const createChatJob = (
  chat: TelegramChat | TelegramChatTarget,
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
      const { method, toDirectInstance, parameters, uploadingFiles } =
        segment.value;

      jobs.push({
        method,
        parameters: {
          ...parameters,
          chat_id: toDirectInstance ? undefined : chat.id,
        },
        executionKey: chat?.uid,
        uploadingFiles: uploadingFiles || null,
      });
    }
  });

  return jobs;
};

export const createDirectInstanceJobs = (
  _: null,
  segments: DispatchableSegment<TelegramSegmentValue>[]
): TelegramJob[] => {
  const jobs: TelegramJob[] = [];

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      throw new TypeError('text is invalid to be rendered without target chat');
    } else {
      const { method, toDirectInstance, parameters, uploadingFiles } =
        segment.value;

      if (!toDirectInstance) {
        throw new TypeError(
          method.slice(0, 4) === 'edit'
            ? 'inlineMessageId is required to edit an inline message'
            : `${formatNode(
                segment.node
              )} is invalid to be rendered without target chat`
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
