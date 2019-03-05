// @flow
import invariant from 'invariant';

import type { MachinatThread, ActionWithoutPause } from 'machinat-base/types';
import type {
  LineSource,
  LineJob,
  LineActionValue,
  LineComponent,
} from '../types';

import { makeMessageFromString, isMessage } from './utils';

const REPLY_PATH = 'message/reply';
const PUSH_PATH = 'message/push';

class LineChatThread implements MachinatThread<LineJob, void> {
  subtype: 'user' | 'room' | 'group' | 'unknown_chat';
  uid: string;
  source: ?LineSource;
  replyToken: ?string;

  sourceId: void | string;
  useReplyAPI: boolean;

  platform = 'line';
  type = 'chat';
  allowPause = true;

  constructor(source: ?LineSource, replyToken: ?string, useReplyAPI: boolean) {
    this.subtype = source ? source.type : 'unknown_chat';

    this.source = source;
    this.replyToken = replyToken;
    this.useReplyAPI = useReplyAPI;
    this.sourceId = source
      ? source.type === 'group'
        ? source.groupId
        : source.type === 'room'
        ? source.roomId
        : source.userId
      : undefined;

    this.uid = `line:default:${this.subtype}:${this.sourceId || '*'}`;
  }

  createJobs(
    actions: null | ActionWithoutPause<LineActionValue, LineComponent>[]
  ) {
    if (actions === null) {
      return null;
    }

    let target: string;
    if (this.useReplyAPI) {
      invariant(
        this.replyToken,
        'replyToken should not be empty when useReplyAPI'
      );

      target = this.replyToken;
    } else {
      invariant(
        this.sourceId !== undefined,
        'source should not be empty when not useReplyAPI'
      );

      target = this.sourceId;
    }

    const jobs: LineJob[] = [];
    let messages: LineActionValue[] = [];

    for (let i = 0; i < actions.length; i += 1) {
      const { element, value } = actions[i];

      const isMsgElement = isMessage(element);

      if (isMsgElement) {
        messages.push(
          typeof value === 'string' ? makeMessageFromString(value) : value
        );
      }

      if (
        messages.length > 0 &&
        (!isMsgElement || messages.length === 5 || i === actions.length - 1)
      ) {
        jobs.push({
          entry: this.useReplyAPI ? REPLY_PATH : PUSH_PATH,
          threadId: this.uid,
          body: this.useReplyAPI
            ? { replyToken: target, messages }
            : { to: (target: string), messages },
        });
        messages = [];
      }

      if (!isMsgElement /* :: && !isMessage(element) */) {
        jobs.push({
          // FIXME: can't refine element.type https://github.com/facebook/flow/issues/6097
          entry: element.type.$$entry(this, value),
          threadId: this.uid,
          body: element.type.$$hasBody ? value : undefined,
        });
      }
    }

    return jobs;
  }
}

export default LineChatThread;
