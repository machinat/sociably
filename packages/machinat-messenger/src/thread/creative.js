// @flow
import invariant from 'invariant';
import { formatElement } from 'machinat-utility';
import type { MachinatThread, ActionWithoutPause } from 'machinat-base/types';

import { ENTRY_MESSAGE_CREATIVES } from '../apiEntry';

import type {
  MessengerMessage,
  MessengerActionValue,
  MessengerJob,
  MessengerComponent,
} from '../types';

import { isMessage, appendField } from './utils';

const POST = 'POST';
const CREATIVE_THREAD_UID = 'messenger:default:message_creatives:*';

const MESSAGE_CREATIVES_THREAD = {
  platform: 'messenger',
  type: 'page_api',
  subtype: 'message_creatives',
  allowPause: false,
  uid: CREATIVE_THREAD_UID,
  createJobs(
    actions:
      | null
      | ActionWithoutPause<MessengerActionValue, MessengerComponent>[]
  ) {
    if (actions === null) {
      return null;
    }

    const messages: MessengerMessage[] = new Array(actions.length);

    for (let i = 0; i < actions.length; i += 1) {
      const { element, value } = actions[i];

      if (typeof value === 'string') {
        messages[i] = { text: value };
      } else {
        invariant(
          isMessage(element) && value.message,
          `${formatElement(
            element || value
          )} is unable to be delivered in message_creatives`
        );

        messages[i] =
          typeof value === 'string' ? { text: value } : value.message;
      }
    }

    return [
      {
        request: {
          body: appendField('', 'messages', JSON.stringify(messages)),
          relative_url: ENTRY_MESSAGE_CREATIVES,
          method: POST,
        },
        threadId: CREATIVE_THREAD_UID,
      },
    ];
  },
};

(MESSAGE_CREATIVES_THREAD: MachinatThread<MessengerJob, void>);

export default MESSAGE_CREATIVES_THREAD;