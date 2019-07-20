// @flow
import invariant from 'invariant';
import { formatNode, filterSymbolKeys } from 'machinat-utility';

import type { SegmentWithoutPause } from 'machinat-base/types';
import type {
  MessengerMessage,
  MessengerSegmentValue,
  MessengerComponent,
  MessengerSendOptions,
  MessengerJob,
} from './types';
import type MessangerChannel from './channel';

import { isMessageEntry } from './utils';
import {
  ENTRY_PATH,
  PATH_MESSAGES,
  PATH_MESSAGE_CREATIVES,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from './constant';

const POST = 'POST';

const { hasOwnProperty } = Object.prototype;

export const createChatJobs = (
  channel: MessangerChannel,
  segments: SegmentWithoutPause<MessengerSegmentValue, MessengerComponent>[],
  options?: MessengerSendOptions
): MessengerJob[] => {
  const { source, uid } = channel;

  const jobs: MessengerJob[] = new Array(segments.length);

  for (let i = 0; i < segments.length; i += 1) {
    const { value } = segments[i];

    const body: Object =
      typeof value === 'string'
        ? { message: { text: value } }
        : filterSymbolKeys(value);

    body.recipient = source;

    if (options && isMessageEntry(value)) {
      if (body.message) {
        if (body.messaging_type === undefined) {
          body.messaging_type = options.messagingType;
          body.tag = options.tag;
        }

        body.notification_type =
          body.notification_type || options.notificationType;

        body.persona_id = body.persona_id || options.personaId;
      } else if (
        body.sender_action === 'typing_on' ||
        body.sender_action === 'typing_off'
      ) {
        body.persona_id = body.persona_id || options.personaId;
      }
    }

    jobs[i] = {
      request: {
        method: POST,
        relative_url:
          // use "me/messages" if ENTRY_PATH not specified
          isMessageEntry(value) ? PATH_MESSAGES : value[ENTRY_PATH],
        body,
      },
      channelUid: uid,
      attachedFileData:
        typeof value === 'object' ? value[ATTACHED_FILE_DATA] : undefined,
      attachedFileInfo:
        typeof value === 'object' ? value[ATTACHED_FILE_INFO] : undefined,
    };
  }

  return jobs;
};

export const createCreativeJobs = (
  channel: null,
  segments: SegmentWithoutPause<MessengerSegmentValue, MessengerComponent>[]
): MessengerJob[] => {
  const messages: MessengerMessage[] = new Array(segments.length);

  for (let i = 0; i < segments.length; i += 1) {
    const { node, value } = segments[i];

    if (typeof value === 'string') {
      messages[i] = { text: value };
    } else {
      // only message pass
      invariant(
        isMessageEntry(value) && hasOwnProperty.call(value, 'message'),
        `${formatNode(
          node || value
        )} is unable to be delivered in message_creatives api`
      );

      invariant(
        !hasOwnProperty.call(value, ATTACHED_FILE_DATA),
        `unable to upload binary data in message_creatives api`
      );

      messages[i] = typeof value === 'string' ? { text: value } : value.message;
    }
  }

  return [
    {
      request: {
        method: POST,
        body: { messages },
        relative_url: PATH_MESSAGE_CREATIVES,
      },
    },
  ];
};
