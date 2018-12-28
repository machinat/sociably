// @flow
import type { InnerAction } from 'machinat-renderer/types';

import { ATTACHED_FILE_DATA, ATTACHED_FILE_INFO } from '../symbol';
import { ENTRY_MESSAGES } from '../apiEntry';

import type MessengerThread from '../thread';
import type {
  MessengerAction,
  MessengerSendOptions,
  MessengerComponent,
  MessengerJob,
} from '../types';

const POST = 'POST';

const appendUrlencodedBody = (body, key, value) =>
  // eslint-disable-next-line prefer-template
  (body === '' ? body : body + '&') + key + '=' + encodeURIComponent(value);

const createRequestFromText = (text: string | number, body: string) => ({
  method: POST,
  relative_url: ENTRY_MESSAGES,
  body: appendUrlencodedBody(
    body,
    'message',
    JSON.stringify({ text: text.toString() })
  ),
  name: undefined,
  depends_on: undefined,
  attached_files: undefined,
  omit_response_on_success: false,
});

const createRequestFromAction = (
  element,
  value: Object,
  currentBody: string
) => {
  const fields = Object.keys(value);

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
      typeof element.type === 'string' ||
      !element.type.$$entry
        ? ENTRY_MESSAGES
        : element.type.$$entry,
    body,
    name: undefined,
    depends_on: undefined,
    attached_files: undefined,
    omit_response_on_success: false,
  };
};

const createJobs = (
  actions: InnerAction<MessengerAction, MessengerComponent>[],
  thread: MessengerThread,
  options: MessengerSendOptions
) => {
  const jobs: MessengerJob[] = new Array(actions.length);

  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const { element, value } = action;

    const body = appendUrlencodedBody(
      '',
      'recipient',
      JSON.stringify(thread.recepient)
    );

    const request =
      typeof value === 'string' || typeof value === 'number'
        ? createRequestFromText(value, body)
        : createRequestFromAction(element, value, body);

    const job = {
      request,
      threadId: thread.uid(),
      attachedFileData: undefined,
      attachedFileInfo: undefined,
    };

    if (typeof value === 'object') {
      job.attachedFileData = value[ATTACHED_FILE_DATA];
      job.attachedFileInfo = value[ATTACHED_FILE_INFO];
    }

    jobs[i] = job;
  }
  return jobs;
};

export default createJobs;
