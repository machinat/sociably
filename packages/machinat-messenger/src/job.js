// @flow
import invariant from 'invariant';
import filterSymbolKeys from '@machinat/core/utils/filterSymbolKeys';
import formatNode from '@machinat/core/utils/formatNode';

import type { DispatchableSegment } from '@machinat/core/engine/types';
import type {
  MessengerSegmentValue,
  MessengerComponent,
  MessengerJob,
  MessengerSendOptions,
} from './types';
import type MessangerChannel from './channel';

import { isMessageEntry } from './utils';
import {
  ENTRY_PATH,
  PATH_MESSAGES,
  PATH_MESSAGE_ATTACHMENTS,
  ATTACHMENT_DATA,
  ATTACHMENT_INFO,
  ASSET_TAG,
} from './constant';

const POST = 'POST';

export const chatJobsMaker = (options?: MessengerSendOptions) => (
  channel: MessangerChannel,
  segments: DispatchableSegment<MessengerSegmentValue, MessengerComponent>[]
): MessengerJob[] => {
  const { target, uid } = channel;
  if (!target) {
    throw new Error(`unable to send to ${channel.type} channel`);
  }

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
    } else if (typeof value === 'string') {
      body = ({ message: { text: value } }: Object);
    } else {
      throw new TypeError('invalid segment value');
    }

    body.recipient = target;

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
  segments: DispatchableSegment<MessengerSegmentValue, MessengerComponent>[]
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
