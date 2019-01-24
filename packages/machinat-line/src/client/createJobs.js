// @flow
import type {
  TextRenderedAction,
  ElementRenderedAction,
  RawAction,
} from 'machinat-renderer/types';

import type {
  LineActionValue,
  LineComponent,
  LineSendOpions,
  LineJob,
  TextActionValue,
} from '../types';
import type LineThread from '../thread';

const REPLY_PATH = 'message/reply';
const PUSH_PATH = 'message/push';

const makeMessageFromString = (text: string): TextActionValue => ({
  type: 'text',
  text,
});

const jobsFactory = ({ useReplyAPI }: { useReplyAPI: boolean }) => (
  actions: (
    | TextRenderedAction
    | ElementRenderedAction<LineActionValue, LineComponent>
    | RawAction
  )[],
  thread: LineThread,
  options: ?LineSendOpions
) => {
  const jobs: LineJob[] = [];
  let messages: void | LineActionValue[];

  for (let i = 0; i < actions.length; i += 1) {
    const { element, value } = actions[i];

    const isMessage =
      typeof element !== 'object' ||
      typeof element.type !== 'function' ||
      element.type.$$entry === undefined;

    if (isMessage) {
      if (messages === undefined) {
        messages = [];
      }

      if (typeof value === 'string') {
        messages.push(makeMessageFromString(value));
      } else {
        messages.push(value);
      }
    }

    if (
      messages !== undefined &&
      (!isMessage || messages.length === 5 || i === actions.length - 1)
    ) {
      jobs.push({
        apiEntry: useReplyAPI ? REPLY_PATH : PUSH_PATH,
        hasBody: true,
        threadId: thread.uid(),
        body: useReplyAPI
          ? // FIXME: this should be validate at client level, how to type it?
            { replyToken: options.replyToken, messages }
          : { to: thread.sourceId, messages },
      });
      messages = undefined;
    }

    if (!isMessage) {
      jobs.push({
        // FIXME: isMessage does refine the element
        apiEntry: element.type.$$entry(thread, value),
        hasBody: element.type.$$hasBody,
        threadId: thread.uid(),
        body: value,
      });
    }
  }

  return jobs;
};

export default jobsFactory;
