import invariant from 'invariant';

import { MESSENGER_NAITVE_TYPE } from './symbol';
import { ENTRY_MESSAGES } from './component/constant';
import * as generalRenderer from './component/general';

const POST = 'POST';

export const appendUrlencodedBody = (body, key, value) =>
  `${body === '' ? body : `${body}&`}${key}=${encodeURIComponent(value)}`;

export const requestJobFromString = (text, body) => ({
  method: POST,
  relative_url: ENTRY_MESSAGES,
  body: appendUrlencodedBody(body, 'message', JSON.stringify({ text })),
});

export const requestJobFromRendered = (renderedResult, currentBody) => {
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

const Delegate = {
  isNativeComponent(component) {
    return !!component && component.$$native === MESSENGER_NAITVE_TYPE;
  },

  renderGeneralElement({ props, type }, render) {
    return generalRenderer[type](props, render);
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
        job = requestJobFromString(rendered, body);
      } else if (typeof element.type === 'string' || element.type.$$root) {
        job = requestJobFromRendered(node, body);
      } else {
        invariant(
          false,
          `illegal root element ${element.type.name || element.type} recieved`
        );
      }

      jobs[i] = job;
    }
    return jobs;
  },
};

export default Delegate;
