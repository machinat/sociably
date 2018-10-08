import invariant from 'invariant';

import {
  MESSENGER_NAITVE_TYPE,
  THREAD_IDENTIFIER,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from './symbol';
import { ENTRY_MESSAGES } from './component/apiEntry';
import * as generalComponents from './component/general';

const POST = 'POST';

const appendUrlencodedBody = (body, key, value) =>
  `${body === '' ? body : `${body}&`}${key}=${encodeURIComponent(value)}`;

const createJobFromString = (text, body) => ({
  method: POST,
  relative_url: ENTRY_MESSAGES,
  body: appendUrlencodedBody(body, 'message', JSON.stringify({ text })),
});

const createJobFromRenderedResult = (renderedResult, currentBody) => {
  const { element, rendered } = renderedResult;
  const fields = Object.keys(rendered);

  let body = currentBody;
  for (let f = 0; f < fields.length; f += 1) {
    const field = fields[f];
    body = appendUrlencodedBody(body, field, JSON.stringify(rendered[field]));
  }

  return {
    method: POST,
    relative_url: element.type.$$entry || ENTRY_MESSAGES,
    body,
  };
};

const makeThreadId = thread =>
  thread.id
    ? `id:${thread.id}`
    : thread.user_ref
      ? `user_ref:${thread.user_ref}`
      : thread.phone_number
        ? `phone_number:${thread.phone_number}`
        : JSON.stringify(thread);

export default {
  isNativeComponent(Component) {
    return !!Component && Component.$$native === MESSENGER_NAITVE_TYPE;
  },

  renderGeneralElement({ props, type }, render) {
    return generalComponents[type](props, render);
  },

  renderNativeElement({ type: Component, props }, render) {
    return Component(props, render);
  },

  createJobsFromRendered(renderedRoots, { thread }) {
    const jobs = new Array(renderedRoots.length);

    for (let i = 0; i < renderedRoots.length; i += 1) {
      const node = renderedRoots[i];
      const { element, rendered } = node;

      const body = appendUrlencodedBody(
        '',
        'recipient',
        JSON.stringify(thread)
      );

      let job;
      if (typeof rendered === 'string') {
        job = createJobFromString(rendered, body);
      } else if (typeof element.type === 'string' || element.type.$$root) {
        job = createJobFromRenderedResult(node, body);
      } else {
        invariant(
          false,
          `'${element.type.name || element.type}' is not legal root Component`
        );
      }

      job[ATTACHED_FILE_DATA] = rendered[ATTACHED_FILE_DATA];
      job[ATTACHED_FILE_INFO] = rendered[ATTACHED_FILE_INFO];
      job[THREAD_IDENTIFIER] = makeThreadId(thread);
      jobs[i] = job;
    }
    return jobs;
  },
};
