// @flow
import type { DispatchableSegment } from '@machinat/core/engine/types';
import type LineChannel from './channel';
import type {
  LineSegmentValue,
  LineMessageSegmentValue,
  LineComponent,
  LineJob,
} from './types';
import {
  PATH_PUSH,
  PATH_REPLY,
  PATH_MULTICAST,
  CHANNEL_API_CALL_GETTER,
  BULK_API_CALL_GETTER,
} from './constant';

const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const createMessageJob = (
  channel: LineChannel,
  messages: LineMessageSegmentValue[],
  replyToken: void | string
) => ({
  method: 'POST',
  path: replyToken ? PATH_REPLY : PATH_PUSH,
  executionKey: channel.uid,
  body: replyToken
    ? { replyToken: (replyToken: string), messages }
    : { to: channel.id, messages },
});

export const chatJobsMaker = (replyToken: void | string) => {
  let messagingJobsCount = 0;

  return (
    channel: LineChannel,
    segments: DispatchableSegment<LineSegmentValue, LineComponent>[]
  ) => {
    const jobs: LineJob[] = [];
    let messagesBuffer: LineMessageSegmentValue[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const { value } = segments[i];

      // use dynamic api call getter if existed
      if (objectHasOwnProperty(value, CHANNEL_API_CALL_GETTER)) {
        // push messages job before the non-message job
        if (messagesBuffer.length > 0) {
          jobs.push(createMessageJob(channel, messagesBuffer, replyToken));
          messagesBuffer = [];
          messagingJobsCount += 1;
        }

        const { method, path, body } = value[CHANNEL_API_CALL_GETTER](channel);
        jobs.push({
          method,
          path,
          executionKey: channel.uid,
          body,
        });
      } else {
        messagesBuffer.push(
          typeof value === 'string'
            ? { type: 'text', text: (value: string) }
            : value
        );

        // empty messages buffer if accumlated to 5 or at the end of loop
        if (messagesBuffer.length === 5 || i === segments.length - 1) {
          jobs.push(createMessageJob(channel, messagesBuffer, replyToken));
          messagesBuffer = [];
          messagingJobsCount += 1;
        }
      }
    }

    if (replyToken && messagingJobsCount > 1) {
      throw new RangeError(
        'more then 1 messaging request rendered while using replyToken'
      );
    }

    return jobs;
  };
};

const MULITCAST_EXECUTION_KEY = '$$_multicast_$$';

export const multicastJobsMaker = (targets: string[]) => (
  _: null,
  segments: DispatchableSegment<LineSegmentValue, LineComponent>[]
) => {
  const jobs: LineJob[] = [];
  let messages: LineSegmentValue[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const { value } = segments[i];

    if (objectHasOwnProperty(value, BULK_API_CALL_GETTER)) {
      if (messages.length > 0) {
        jobs.push({
          method: 'POST',
          path: PATH_MULTICAST,
          body: { to: targets, messages },
          executionKey: MULITCAST_EXECUTION_KEY,
        });
        messages = [];
      }

      const { method, path, body } = value[BULK_API_CALL_GETTER](targets);
      jobs.push({
        method,
        path,
        executionKey: MULITCAST_EXECUTION_KEY,
        body,
      });
    } else {
      messages.push(
        typeof value === 'string'
          ? { type: 'text', text: (value: string) }
          : value
      );

      if (messages.length === 5 || i === segments.length - 1) {
        jobs.push({
          method: 'POST',
          path: PATH_MULTICAST,
          body: { to: targets, messages },
          executionKey: MULITCAST_EXECUTION_KEY,
        });
        messages = [];
      }
    }
  }

  return jobs;
};
