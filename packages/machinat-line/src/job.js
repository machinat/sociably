// @flow
import invariant from 'invariant';
import { formatNode, filterSymbolKeys } from 'machinat-utility';

import type { SegmentWithoutPause } from 'machinat-base/types';
import type LineChannel from './channel';
import type {
  LineSegmentValue,
  LineComponent,
  LineJob,
  LineSendOptions,
} from './types';
import {
  PATH_PUSH,
  PATH_REPLY,
  PATH_MULTICAST,
  ENTRY_GETTER,
} from './constant';
import { isMessageValue } from './utils';

export const createChatJobs = (
  channel: LineChannel,
  segments: SegmentWithoutPause<LineSegmentValue, LineComponent>[],
  options?: LineSendOptions
) => {
  const replyToken = options && options.replyToken;

  const jobs: LineJob[] = [];
  let messagesBuffer: LineSegmentValue[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const { value } = segments[i];

    const isMesssage = isMessageValue(value);

    // push message to buffer
    if (isMesssage) {
      messagesBuffer.push(
        typeof value === 'string'
          ? { type: 'text', text: (value: string) }
          : filterSymbolKeys(value)
      );
    }

    // if non-message met, loop ended or messagesBuffer accumulated up to 5
    // move buffered messages into job
    if (
      messagesBuffer.length > 0 &&
      (!isMesssage || messagesBuffer.length === 5 || i === segments.length - 1)
    ) {
      jobs.push({
        method: 'POST',
        path: replyToken ? PATH_REPLY : PATH_PUSH,
        channelUid: channel.uid,
        body: replyToken
          ? { replyToken: (replyToken: string), messages: messagesBuffer }
          : { to: (channel.sourceId: string), messages: messagesBuffer },
      });
      messagesBuffer = [];
    }

    // if non message met, use value as body directly and get dynamic entry
    if (!isMesssage) {
      const { method, path } = (value: any)[ENTRY_GETTER](channel);

      jobs.push({
        method,
        path,
        channelUid: channel.uid,
        body: filterSymbolKeys(value),
      });
    }
  }

  return jobs;
};

export const createMulticastJobs = (
  targets: string[],
  segments: SegmentWithoutPause<LineSegmentValue, LineComponent>[]
) => {
  const jobs: LineJob[] = [];
  let messages: LineSegmentValue[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const { node, value } = segments[i];

    invariant(
      !hasOwnProperty.call(value, ENTRY_GETTER),
      `${formatNode(node)} is invalid to be delivered in multicast`
    );

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
      });
      messages = [];
    }
  }

  return jobs;
};
