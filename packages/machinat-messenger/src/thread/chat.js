// @flow
/* eslint-disable camelcase */
import crypto from 'crypto';
import type { MachinatThread, ActionWithoutPause } from 'machinat-base/types';

import { ATTACHED_FILE_DATA, ATTACHED_FILE_INFO } from '../symbol';
import { ENTRY_MESSAGES } from '../apiEntry';

import type {
  Recipient,
  MessengerActionValue,
  SendOptions,
  MessengerJob,
  MessengerComponent,
} from '../types';

import { isMessage, appendField, appendFields } from './utils';

const POST = 'POST';

class MessengerThread
  implements MachinatThread<MessengerJob, void | SendOptions> {
  uid: string;
  recepient: Recipient;
  pageId: ?string;

  platform = 'messenger';
  type = 'chat';
  subtype = 'user';
  allowPause = true;

  constructor(recepient: Recipient, pageId?: string) {
    this.recepient = recepient;
    this.pageId = pageId;

    this.uid = `messenger:${this.pageId || 'default'}:${
      recepient.id
        ? `user:${recepient.id}`
        : recepient.user_ref
        ? `user_ref:${recepient.user_ref}`
        : recepient.phone_number
        ? `phone_number:${crypto
            .createHash('sha1')
            .update(recepient.phone_number)
            .digest('base64')}`
        : 'chat:*'
    }`;
  }

  createJobs(
    actions:
      | null
      | ActionWithoutPause<MessengerActionValue, MessengerComponent>[],
    options?: SendOptions
  ) {
    if (actions === null) {
      return null;
    }

    const sharedBody = appendField(
      '',
      'recipient',
      JSON.stringify(this.recepient)
    );

    const jobs: MessengerJob[] = new Array(actions.length);

    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];
      const { element, value } = action;

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

      const job: MessengerJob = {
        request: {
          method: POST,
          relative_url: isMessage(element)
            ? ENTRY_MESSAGES
            : // $FlowFixMe can't refine element.type https://github.com/facebook/flow/issues/6097
              element.type.$$entry,
          body: appendFields(sharedBody, fields),
        },
        threadId: this.uid,
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
