// @flow
import type {
  MachinatGeneralElement,
  MachinatNativeElement,
} from 'types/element';
import type { RenderDelegate, RenderInnerFn } from 'machinat-renderer/types';

import {
  MESSENGER_NAITVE_TYPE,
  THREAD_IDENTIFIER,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from './symbol';
import { ENTRY_MESSAGES } from './apiEntry';
import * as generalComponents from './component/general';

import type {
  MessengerComponent,
  ComponentRendered,
  MessengerJob,
} from './types';

const POST = 'POST';

const appendUrlencodedBody = (body, key, value) =>
  `${body === '' ? body : `${body}&`}${key}=${encodeURIComponent(value)}`;

const createJobFromText = (text: string | number, body: string) => ({
  method: POST,
  relative_url: ENTRY_MESSAGES,
  body: appendUrlencodedBody(
    body,
    'message',
    JSON.stringify({ text: text.toString() })
  ),
});

const createJobFromElementRendered = (element, value, currentBody: string) => {
  const fields = Object.keys((value: Object));

  let body = currentBody;
  for (let f = 0; f < fields.length; f += 1) {
    const field = fields[f];
    body = appendUrlencodedBody(body, field, JSON.stringify(value[field]));
  }

  return {
    method: POST,
    relative_url:
      !element ||
      typeof element === 'string' ||
      typeof element === 'number' ||
      typeof element.type === 'string'
        ? ENTRY_MESSAGES
        : element.type.$$entry,
    body,
  };
};

const makeThreadId = thread =>
  // prettier-ignore
  thread.id
    ? `id:${thread.id}`
    : thread.user_ref
    ? `user_ref:${thread.user_ref}`
    : thread.phone_number
    ? `phone_number:${thread.phone_number}`
    : JSON.stringify(thread);

const MessengerRenderDelegate: RenderDelegate<
  ComponentRendered,
  MessengerJob,
  MessengerComponent
> = {
  isNativeComponent(Component: any) {
    return !!Component && Component.$$native === MESSENGER_NAITVE_TYPE;
  },

  renderGeneralElement(
    { props, type }: MachinatGeneralElement,
    render: RenderInnerFn
  ) {
    if (!(type in generalComponents)) {
      throw new TypeError(
        `<${type} /> is not valid general element supported in messenger`
      );
    }
    return generalComponents[type](props, render);
  },

  renderNativeElement(
    { type: Component, props }: MachinatNativeElement<MessengerComponent>,
    render: RenderInnerFn
  ) {
    return Component(props, render);
  },

  createJobsFromRendered(roots, { thread }) {
    const jobs = new Array(roots.length);

    for (let i = 0; i < roots.length; i += 1) {
      const rendered = roots[i];
      const { element, value } = rendered;

      const body = appendUrlencodedBody(
        '',
        'recipient',
        JSON.stringify(thread)
      );

      const job =
        typeof value === 'string' || typeof value === 'number'
          ? createJobFromText(value, body)
          : createJobFromElementRendered(element, value, body);

      // FIXME: type the symbol props after supported in flow
      job[THREAD_IDENTIFIER] = makeThreadId(thread);
      if (typeof value === 'object') {
        job[ATTACHED_FILE_DATA] = value[ATTACHED_FILE_DATA];
        job[ATTACHED_FILE_INFO] = value[ATTACHED_FILE_INFO];
      }
      jobs[i] = job;
    }
    return jobs;
  },
};

export default MessengerRenderDelegate;
