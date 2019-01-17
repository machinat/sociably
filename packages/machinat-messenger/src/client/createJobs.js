// @flow
import type { GeneralElement, NativeElement } from 'types/element';
import type {
  TextRenderedAction,
  ElementRenderedAction,
  RawAction,
} from 'machinat-renderer/types';

import { ATTACHED_FILE_DATA, ATTACHED_FILE_INFO } from '../symbol';
import { ENTRY_MESSAGES } from '../apiEntry';

import type MessengerThread from '../thread';
import type {
  MessengerAction,
  MessengerSendOptions,
  MessengerJob,
  MessengerComponent,
} from '../types';

const POST = 'POST';

const appendURIencoded = (body, key, value) =>
  // eslint-disable-next-line prefer-template
  (body === '' ? body : body + '&') + key + '=' + encodeURIComponent(value);

const createRequest = (
  element,
  value: number | string | MessengerAction,
  currentBody: string,
  options: ?MessengerSendOptions
) => {
  const valueFields =
    typeof value === 'number' || typeof value === 'string'
      ? { message: { text: value.toString() } }
      : value;

  const fields: Object = options
    ? {
        messaging_type: options.messagingType,
        tag: options.tag,
        notification_type: options.notificationType,
        persona_id: options.personaId,
        ...valueFields,
      }
    : valueFields;

  const keys = Object.keys(fields);
  let body = currentBody;

  for (let i = 0; i < keys.length; i += 1) {
    const fieldKey = keys[i];
    const fieldVal = fields[fieldKey];

    if (fieldVal !== undefined) {
      body = appendURIencoded(
        body,
        fieldKey,
        typeof fieldVal === 'object' ? JSON.stringify(fieldVal) : fieldVal
      );
    }
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
  actions: (
    | TextRenderedAction
    | ElementRenderedAction<MessengerAction, GeneralElement>
    | ElementRenderedAction<MessengerAction, NativeElement<MessengerComponent>>
    | RawAction
  )[],
  thread: MessengerThread,
  options: ?MessengerSendOptions
) => {
  const jobs: MessengerJob[] = new Array(actions.length);

  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const { element, value } = action;

    const body = appendURIencoded(
      '',
      'recipient',
      JSON.stringify(thread.recepient)
    );

    const request = createRequest(element, value, body, options);

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
