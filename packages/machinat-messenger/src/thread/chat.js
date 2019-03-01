// @flow
/* eslint-disable camelcase */
import crypto from 'crypto';
import type { MachinatThread, ActionWithoutPause } from 'machinat-base/types';

import { ATTACHED_FILE_DATA, ATTACHED_FILE_INFO } from '../symbol';
import { ENTRY_MESSAGES } from '../apiEntry';

import type {
  Recepient,
  MessengerActionValue,
  MessengerSendOptions,
  MessengerJob,
  MessengerComponent,
} from '../types';

import { isMessage, appendURIField } from './utils';

const POST = 'POST';

class MessengerThread
  implements MachinatThread<MessengerJob, void | MessengerSendOptions> {
  recepient: Recepient;
  pageId: ?string;

  platform = 'messenger';
  type = 'chat';
  subtype = 'user';
  allowPause = true;

  constructor(recepient: Recepient, pageId?: string) {
    this.recepient = recepient;
    this.pageId = pageId;
  }

  uid() {
    const { recepient } = this;
    const pagePrefix = `messenger:${this.pageId || 'default'}`;

    return recepient.id
      ? `${pagePrefix}:user:${recepient.id}`
      : recepient.user_ref
      ? `${pagePrefix}:user_ref:${recepient.user_ref}`
      : recepient.phone_number
      ? `${pagePrefix}:phone_number:${crypto
          .createHash('sha1')
          .update(recepient.phone_number)
          .digest('base64')}`
      : JSON.stringify(recepient);
  }

  createJobs(
    actions: ActionWithoutPause<MessengerActionValue, MessengerComponent>[],
    options?: MessengerSendOptions
  ) {
    const jobs: MessengerJob[] = new Array(actions.length);

    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];
      const { element, value } = action;

      let body = appendURIField(
        '',
        'recipient',
        JSON.stringify(this.recepient)
      );

      const fields: Object =
        typeof value === 'string' ? { message: { text: value } } : value;

      if (options) {
        if (fields.messaging_type === undefined) {
          fields.messaging_type = options.messagingType;
          fields.tag = options.tag;
        }
        if (fields.notification_type === undefined)
          fields.notification_type = options.notificationType;
        if (fields.persona_id === undefined)
          fields.persona_id = options.personaId;
      }

      for (const key of Object.keys(fields)) {
        const fieldValue = fields[key];

        if (fieldValue !== undefined) {
          const fieldContent =
            typeof fieldValue === 'object'
              ? JSON.stringify(fieldValue)
              : fieldValue;

          body = appendURIField(body, key, fieldContent);
        }
      }

      const job: MessengerJob = {
        request: {
          method: POST,
          relative_url: isMessage(element)
            ? ENTRY_MESSAGES
            : // $FlowFixMe can't refine element.type https://github.com/facebook/flow/issues/6097
              element.type.$$entry,
          body,
        },
        threadId: this.uid(),
        attachedFileData:
          typeof value === 'object' ? value[ATTACHED_FILE_DATA] : undefined,
        attachedFileInfo:
          typeof value === 'object' ? value[ATTACHED_FILE_INFO] : undefined,
      };

      jobs[i] = job;
    }

    return jobs;
  }
}

export default MessengerThread;
