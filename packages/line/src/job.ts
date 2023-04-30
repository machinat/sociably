import { formatNode } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import type LineChat from './Chat';
import { PATH_PUSH, PATH_REPLY, PATH_MULTICAST } from './constant';
import type { LineSegmentValue, LineJob, MessageParams } from './types';
import LineChannel from './Channel';

const createMessageJob = (
  thread: LineChat,
  messages: MessageParams[],
  replyToken: undefined | string
): LineJob => ({
  method: 'POST',
  path: replyToken ? PATH_REPLY : PATH_PUSH,
  key: thread.uid,
  chatChannelId: thread.channelId,
  accessToken: undefined,
  body: replyToken
    ? { replyToken: replyToken as string, messages }
    : { to: thread.id, messages },
});

export const createChatJobs = (replyToken: undefined | string) => {
  let totalJobsCount = 0;

  return (
    thread: LineChat,
    segments: DispatchableSegment<LineSegmentValue>[]
  ): LineJob[] => {
    const jobs: LineJob[] = [];
    let messagesBuffer: MessageParams[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const { node, value } = segments[i];

      if (typeof value === 'string' || value.type === 'message') {
        messagesBuffer.push(
          typeof value === 'string'
            ? { type: 'text', text: value }
            : value.params
        );

        // flush messages buffer if accumlated to 5 or at the end of loop
        if (messagesBuffer.length === 5 || i === segments.length - 1) {
          jobs.push(
            createMessageJob(
              thread,
              messagesBuffer,
              totalJobsCount === 0 ? replyToken : undefined
            )
          );
          messagesBuffer = [];
          totalJobsCount += 1;
        }
      } else {
        // push buffered messages first
        if (messagesBuffer.length > 0) {
          jobs.push(
            createMessageJob(
              thread,
              messagesBuffer,
              totalJobsCount === 0 ? replyToken : undefined
            )
          );
          messagesBuffer = [];
          totalJobsCount += 1;
        }

        if (!value.getChatRequest) {
          throw new Error(
            `${formatNode(node)} is not valid to be sent in a chat`
          );
        }

        // get dynamic api request
        const { method, path, body } = value.getChatRequest(thread);
        jobs.push({
          method,
          path,
          key: thread.uid,
          chatChannelId: thread.channelId,
          accessToken: undefined,
          body,
        });
      }
    }

    return jobs;
  };
};

const MULITCAST_EXECUTION_KEY = 'line.multicast';

export const createMulticastJobs =
  (channel: LineChannel, targets: string[]) =>
  (_: null, segments: DispatchableSegment<LineSegmentValue>[]): LineJob[] => {
    const jobs: LineJob[] = [];
    let messages: MessageParams[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const { node, value } = segments[i];

      if (typeof value === 'string' || value.type === 'message') {
        messages.push(
          typeof value === 'string'
            ? { type: 'text', text: value }
            : value.params
        );

        // flush messages buffer if accumlated to 5 or at the end of loop
        if (messages.length === 5 || i === segments.length - 1) {
          jobs.push({
            method: 'POST',
            path: PATH_MULTICAST,
            body: { to: targets, messages },
            key: MULITCAST_EXECUTION_KEY,
            chatChannelId: channel.id,
            accessToken: undefined,
          });
          messages = [];
        }
      } else {
        // push buffered messages first
        if (messages.length > 0) {
          jobs.push({
            method: 'POST',
            path: PATH_MULTICAST,
            body: { to: targets, messages },
            key: MULITCAST_EXECUTION_KEY,
            chatChannelId: channel.id,
            accessToken: undefined,
          });
          messages = [];
        }

        if (!value.getBulkRequest) {
          throw new Error(
            `${formatNode(node)} is not valid to be sent by multicast`
          );
        }

        // get dynamic api request
        const { method, path, body } = value.getBulkRequest(targets);
        jobs.push({
          method,
          path,
          body,
          key: MULITCAST_EXECUTION_KEY,
          chatChannelId: channel.id,
          accessToken: undefined,
        });
      }
    }

    return jobs;
  };
