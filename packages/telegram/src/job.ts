import { formatNode } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import type { TelegramSegmentValue, TelegramJob } from './types';
import type TelegramChat from './Chat';
import type TelegramUser from './User';

export const createChatJob = (
  chat: TelegramChat,
  segments: DispatchableSegment<TelegramSegmentValue>[]
): TelegramJob[] => {
  const jobs: TelegramJob[] = [];

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      jobs.push({
        botId: chat.botId,
        method: 'sendMessage',
        params: {
          chat_id: chat.id,
          text: segment.value,
          parse_mode: 'HTML',
        },
        key: chat.uid,
        uploadFiles: null,
      });
    } else {
      const { method, toNonChatTarget, params, uploadFiles } = segment.value;

      jobs.push({
        botId: chat.botId,
        method,
        params: {
          ...params,
          chat_id: toNonChatTarget ? undefined : chat.id,
        },
        key: chat?.uid,
        uploadFiles: uploadFiles || null,
      });
    }
  });

  return jobs;
};

export const createBotScopeJobs = (
  botUser: TelegramUser,
  segments: DispatchableSegment<TelegramSegmentValue>[]
): TelegramJob[] => {
  const jobs: TelegramJob[] = [];

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      throw new TypeError('text is invalid to be rendered without target chat');
    } else {
      const { method, toNonChatTarget, params, uploadFiles } = segment.value;

      if (!toNonChatTarget) {
        throw new TypeError(
          method.slice(0, 4) === 'edit'
            ? 'inlineMessageId is required to edit an inline message'
            : `${formatNode(
                segment.node
              )} is invalid to be rendered without target chat`
        );
      }

      jobs.push({
        botId: botUser.id,
        method,
        params,
        key: undefined,
        uploadFiles: uploadFiles || null,
      });
    }
  });

  return jobs;
};
