import invariant from 'invariant';
import {
  LINE_NAITVE_TYPE,
  API_PATH,
  GET_API_PATH,
  THREAD_ID,
  HAS_BODY,
} from './symbol';
import * as generalComponents from './component/general';

const REPLY_PATH = 'message/reply';
const PUSH_PATH = 'message/push';

const makeMessageFromString = text => ({
  type: 'text',
  text,
});

export default ({ useReplyAPI }) => ({
  isNativeComponent(Component) {
    return !!Component && Component.$$native === LINE_NAITVE_TYPE;
  },

  renderGeneralElement({ props, type }, render) {
    return generalComponents[type](props, render);
  },

  renderNativeElement({ type: Component, props }, render) {
    return Component(props, render);
  },

  createJobsFromRendered(renderedRoots, { thread, options }) {
    const replyToken = options && options.replyToken;
    const { type } = thread;
    const threadId =
      type === 'group'
        ? thread.groupId
        : type === 'room'
          ? thread.roomId
          : thread.userId;

    const jobs = [];
    let messages;

    for (let i = 0; i < renderedRoots.length; i += 1) {
      const { element, value } = renderedRoots[i];

      const isMessage = value[GET_API_PATH] === undefined;
      if (isMessage) {
        if (messages === undefined) {
          messages = [];
        }

        if (typeof value === 'string') {
          messages.push(makeMessageFromString(value));
        } else if (typeof element.type === 'string' || element.type.$$root) {
          messages.push(value);
        } else {
          invariant(
            false,
            `'${element.type.name || element.type}' is not legal root Component`
          );
        }
      }

      if (
        messages !== undefined &&
        (!isMessage || messages.length === 5 || i === renderedRoots.length - 1)
      ) {
        jobs.push({
          [API_PATH]: useReplyAPI ? REPLY_PATH : PUSH_PATH,
          [HAS_BODY]: true,
          [THREAD_ID]: threadId,
          to: useReplyAPI ? undefined : threadId,
          replyToken: useReplyAPI ? replyToken : undefined,
          messages,
        });
        messages = undefined;
      }

      if (!isMessage) {
        jobs.push({
          [API_PATH]: value[GET_API_PATH](thread),
          [HAS_BODY]: false,
          [THREAD_ID]: threadId,
        });
      }
    }

    return jobs;
  },
});
