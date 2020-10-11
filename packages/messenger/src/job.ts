/** @internal */ /** */
import invariant from 'invariant';
import filterSymbolKeys from '@machinat/core/utils/filterSymbolKeys';
import formatNode from '@machinat/core/utils/formatNode';

import type { DispatchableSegment } from '@machinat/core/engine/types';
import type {
  MessengerSegmentValue,
  MessengerJob,
  MessengerSendOptions,
} from './types';
import type MessengerChat from './channel';

import { isMessageEntry } from './utils';
import {
  API_PATH,
  PATH_MESSAGES,
  PATH_MESSAGE_ATTACHMENTS,
  ATTACHMENT_DATA,
  ATTACHMENT_INFO,
  ATTACHMENT_ASSET_TAG,
  MESSENGER_MESSAGING_TYPE_RESPONSE,
} from './constant';

const POST = 'POST';

export const chatJobsMaker = (options?: MessengerSendOptions) => (
  channel: MessengerChat,
  segments: DispatchableSegment<MessengerSegmentValue>[]
): MessengerJob[] => {
  const { target, uid } = channel;
  if (!target) {
    throw new Error(`unable to send to ${channel.type} channel`);
  }

  const jobs: MessengerJob[] = new Array(segments.length);

  for (let i = 0; i < segments.length; i += 1) {
    const { value } = segments[i];

    let body: any;
    let relativeURL: undefined | string;
    let attachmentAssetTag: undefined | string;
    let attachmentFileData: undefined | any;
    let attachmentFileInfo: undefined | any;

    if (typeof value === 'object') {
      body = filterSymbolKeys(value);
      relativeURL = value[API_PATH];
      attachmentAssetTag = value[ATTACHMENT_ASSET_TAG];
      attachmentFileData = value[ATTACHMENT_DATA];
      attachmentFileInfo = value[ATTACHMENT_INFO];
    } else if (typeof value === 'string') {
      body = { message: { text: value } };
    } else {
      throw new TypeError('invalid segment value');
    }

    body.recipient = target;

    if (options && isMessageEntry(value)) {
      if (body.message) {
        if (body.messaging_type === undefined) {
          body.messaging_type =
            options.messagingType || MESSENGER_MESSAGING_TYPE_RESPONSE;
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
        relative_url: relativeURL || PATH_MESSAGES,
        body,
      },
      channelUId: uid,
      attachmentAssetTag,
      attachmentFileData,
      attachmentFileInfo,
    };
  }

  return jobs;
};

export const makeAttachmentJobs = (
  target: null,
  segments: DispatchableSegment<MessengerSegmentValue>[]
): MessengerJob[] => {
  invariant(segments.length === 1, 'more than 1 message received');

  const [{ value, node }] = segments;
  invariant(
    typeof value === 'object' && 'message' in value && value.message.attachment,
    `non attachment message ${formatNode(node || value)} received`
  );

  const attachmentType = value.message.attachment.type;
  invariant(
    attachmentType === 'image' ||
      attachmentType === 'video' ||
      attachmentType === 'audio' ||
      attachmentType === 'file',
    `invalid attachment type "${attachmentType}" to be uploaded`
  );

  const body = filterSymbolKeys(value);
  return [
    {
      attachmentFileData: value[ATTACHMENT_DATA],
      attachmentFileInfo: value[ATTACHMENT_INFO],
      request: {
        method: POST,
        relative_url: PATH_MESSAGE_ATTACHMENTS,
        body,
      },
    },
  ];
};
