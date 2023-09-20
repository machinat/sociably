import { formatNode } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import type { TelegramSegmentValue, TelegramJob } from './types.js';
import type TelegramChat from './Chat.js';
import type TelegramUser from './User.js';

export const createChatJob = (
  chat: TelegramChat,
  segments: DispatchableSegment<TelegramSegmentValue>[],
): TelegramJob[] => {
  const jobs: TelegramJob[] = [];

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      jobs.push({
        agentId: chat.botId,
        method: 'sendMessage',
        params: {
          chat_id: chat.id,
          text: segment.value,
          parse_mode: 'HTML',
        },
        key: chat.uid,
        files: [],
      });
    } else {
      const { method, toNonChatTarget, params, files } = segment.value;

      jobs.push({
        agentId: chat.botId,
        method,
        params: {
          ...params,
          chat_id: toNonChatTarget ? undefined : chat.id,
        },
        key: chat?.uid,
        files,
      });
    }
  });

  return jobs;
};

export const createBotScopeJobs = (
  botUser: TelegramUser,
  segments: DispatchableSegment<TelegramSegmentValue>[],
): TelegramJob[] => {
  const jobs: TelegramJob[] = [];

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      throw new TypeError('text is invalid to be rendered without target chat');
    } else {
      const { method, toNonChatTarget, params, files } = segment.value;

      if (!toNonChatTarget) {
        throw new TypeError(
          method.startsWith('edit')
            ? 'inlineMessageId is required to edit an inline message'
            : `${formatNode(
                segment.node,
              )} is invalid to be rendered without target chat`,
        );
      }

      jobs.push({
        agentId: botUser.id,
        method,
        params,
        key: undefined,
        files,
      });
    }
  });

  return jobs;
};
