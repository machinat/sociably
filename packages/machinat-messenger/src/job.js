// @flow
import invariant from 'invariant';
import { formatNode } from 'machinat-utility';

import type { SegmentWithoutPause } from 'machinat-base/types';
import type {
  MessengerMessage,
  MessengerSegmentValue,
  MessengerComponent,
  SendOptions,
  MessengerJob,
} from './types';
import type MessangerThread from './thread';

import {
  ENTRY_MESSAGES,
  ENTRY_MESSAGE_CREATIVES,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from './constant';

const POST = 'POST';

const isMessagesEntry = node =>
  typeof node !== 'object' ||
  typeof node.type !== 'function' ||
  node.type.$$entry === ENTRY_MESSAGES;

export const createChatJobs = (
  thread: MessangerThread,
  segments: SegmentWithoutPause<MessengerSegmentValue, MessengerComponent>[],
  options?: SendOptions
): MessengerJob[] => {
  const { source, uid } = thread;

  const jobs: MessengerJob[] = new Array(segments.length);

  for (let i = 0; i < segments.length; i += 1) {
    const { node, value } = segments[i];

    const fields: MessengerSegmentValue =
      typeof value === 'string' ? { message: { text: value } } : value;

    const body: Object = { ...fields, recipient: source };

    if (options && isMessagesEntry(node) && body.message) {
      if (body.messaging_type === undefined) {
        body.messaging_type = options.messagingType;
        body.tag = options.tag;
      }
      if (body.notification_type === undefined) {
        body.notification_type = options.notificationType;
      }
      if (body.persona_id === undefined) {
        body.persona_id = options.personaId;
      }
    }

    jobs[i] = {
      request: {
        method: POST,
        relative_url:
          // use "me/messages" if $$entry not specified on native component
          isMessagesEntry(node)
            ? ENTRY_MESSAGES
            : // $FlowFixMe can't refine node.type https://github.com/facebook/flow/issues/6097
              node.type.$$entry,
        body,
      },
      threadUid: uid,
      attachedFileData:
        typeof value === 'object' ? value[ATTACHED_FILE_DATA] : undefined,
      attachedFileInfo:
        typeof value === 'object' ? value[ATTACHED_FILE_INFO] : undefined,
    };
  }

  return jobs;
};

export const createCreativeJobs = (
  thread: null,
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
        isMessagesEntry(node) && value.message,
        `${formatNode(
          node || value
        )} is unable to be delivered in message_creatives api`
      );

      invariant(
        !(ATTACHED_FILE_DATA in value),
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
        relative_url: ENTRY_MESSAGE_CREATIVES,
      },
    },
  ];
};
