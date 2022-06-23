import type { DispatchableSegment } from '@sociably/core/engine';
import type LineChat from './Chat';
import type {
  LineSegmentValue,
  LineMessageSegmentValue,
  LineJob,
} from './types';
import {
  PATH_PUSH,
  PATH_REPLY,
  PATH_MULTICAST,
  CHANNEL_REQUEST_GETTER,
  BULK_REQUEST_GETTER,
} from './constant';
import { isMessageValue } from './utils';

const createMessageJob = (
  channel: LineChat,
  messages: LineMessageSegmentValue[],
  replyToken: undefined | string
): LineJob => ({
  method: 'POST',
  path: replyToken ? PATH_REPLY : PATH_PUSH,
  executionKey: channel.uid,
  body: replyToken
    ? { replyToken: replyToken as string, messages }
    : { to: channel.id, messages },
});

export const createChatJobs = (replyToken: undefined | string) => {
  let totalJobsCount = 0;

  return (
    channel: LineChat,
    segments: DispatchableSegment<LineSegmentValue>[]
  ): LineJob[] => {
    const jobs: LineJob[] = [];
    let messagesBuffer: LineMessageSegmentValue[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const { value } = segments[i];

      if (isMessageValue(value)) {
        messagesBuffer.push(
          typeof value === 'string'
            ? { type: 'text', text: value as string }
            : value
        );

        // flush messages buffer if accumlated to 5 or at the end of loop
        if (messagesBuffer.length === 5 || i === segments.length - 1) {
          jobs.push(
            createMessageJob(
              channel,
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
              channel,
              messagesBuffer,
              totalJobsCount === 0 ? replyToken : undefined
            )
          );
          messagesBuffer = [];
          totalJobsCount += 1;
        }

        // get dynamic api request
        const { method, path, body } = value[CHANNEL_REQUEST_GETTER](channel);
        jobs.push({
          method,
          path,
          executionKey: channel.uid,
          body,
        });
      }
    }

    return jobs;
  };
};

const MULITCAST_EXECUTION_KEY = '$$_multicast_$$';

export const createMulticastJobs =
  (targets: string[]) =>
  (_: null, segments: DispatchableSegment<LineSegmentValue>[]) => {
    const jobs: LineJob[] = [];
    let messages: LineSegmentValue[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const { value } = segments[i];

      if (isMessageValue(value)) {
        messages.push(
          typeof value === 'string'
            ? { type: 'text', text: value as string }
            : value
        );

        // flush messages buffer if accumlated to 5 or at the end of loop
        if (messages.length === 5 || i === segments.length - 1) {
          jobs.push({
            method: 'POST',
            path: PATH_MULTICAST,
            body: { to: targets, messages },
            executionKey: MULITCAST_EXECUTION_KEY,
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
            executionKey: MULITCAST_EXECUTION_KEY,
          });
          messages = [];
        }

        // get dynamic api request
        const { method, path, body } = value[BULK_REQUEST_GETTER](targets);
        jobs.push({
          method,
          path,
          executionKey: MULITCAST_EXECUTION_KEY,
          body,
        });
      }
    }

    return jobs;
  };
