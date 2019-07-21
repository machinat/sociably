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
  PATH_MESSAGE_ATTACHMENTS,
  ATTACHMENT_DATA,
  ATTACHMENT_INFO,
  ASSET_TAG,
} from './constant';

const POST = 'POST';

export const createChatJobs = (
  channel: MessangerChannel,
  segments: SegmentWithoutPause<MessengerSegmentValue, MessengerComponent>[],
  options?: MessengerSendOptions
): MessengerJob[] => {
  const { source, uid } = channel;

  const jobs: MessengerJob[] = new Array(segments.length);

  for (let i = 0; i < segments.length; i += 1) {
    const { value } = segments[i];

    let body: Object;
    let specifiedURL: void | string;
    let attachmentAssetTag: void | string;
    let attachmentFileData: void | Object;
    let attachmentFileInfo: void | Object;

    if (typeof value === 'object') {
      body = filterSymbolKeys(value);
      specifiedURL = value[ENTRY_PATH];
      attachmentAssetTag = value[ASSET_TAG];
      attachmentFileData = value[ATTACHMENT_DATA];
      attachmentFileInfo = value[ATTACHMENT_INFO];
    } else {
      body = ({ message: { text: value } }: Object);
    }

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
        relative_url: specifiedURL || PATH_MESSAGES,
        body,
      },
      channelUid: uid,
      attachmentAssetTag,
      attachmentFileData,
      attachmentFileInfo,
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
        isMessageEntry(value) && value.message,
        `${formatNode(
          node || value
        )} is unable to be delivered in message_creatives api`
      );

      invariant(
        !value[ATTACHMENT_DATA],
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

export const createAttachmentJobs = (
  channel: null,
  segments: SegmentWithoutPause<MessengerSegmentValue, MessengerComponent>[]
): MessengerJob[] => {
  invariant(segments.length === 1, 'more than 1 message received');

  const [{ value, node }] = segments;

  let attachmentType;
  invariant(
    typeof value === 'object' &&
      value.message &&
      value.message.attachment &&
      ((attachmentType = value.message.attachment.type) === 'image' ||
        attachmentType === 'video' ||
        attachmentType === 'audio' ||
        attachmentType === 'file'),
    `non attachment message ${formatNode(node || value)} received`
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
