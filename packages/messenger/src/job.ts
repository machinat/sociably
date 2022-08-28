import invariant from 'invariant';
import { filterSymbolKeys, formatNode } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import type { MetaApiJob, FileInfo } from '@sociably/meta-api';
import type {
  MessengerSegmentValue,
  MessengerSendOptions,
  MessengerChannel,
} from './types';
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

export const createChatJobs = (options?: MessengerSendOptions) => {
  let isOneTimeTokenUsed = false;

  return (
    channel: MessengerChannel,
    segments: DispatchableSegment<MessengerSegmentValue>[]
  ): MetaApiJob[] => {
    const jobs: MetaApiJob[] = new Array(segments.length);

    for (let i = 0; i < segments.length; i += 1) {
      const { value } = segments[i];

      let body: { [k: string]: unknown };
      let relativeUrl: undefined | string;
      let assetTag: undefined | string;
      let fileData: undefined | string | Buffer | NodeJS.ReadableStream;
      let fileInfo: undefined | FileInfo;

      if (typeof value === 'object') {
        body = filterSymbolKeys(value);
        relativeUrl = value[API_PATH];
        assetTag = value[ATTACHMENT_ASSET_TAG];
        fileData = value[ATTACHMENT_DATA];
        fileInfo = value[ATTACHMENT_INFO];
      } else if (typeof value === 'string') {
        body = { message: { text: value } };
      } else {
        throw new TypeError('invalid segment value');
      }

      body.recipient = channel.target;

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

          if (options.oneTimeNotifToken) {
            if (isOneTimeTokenUsed) {
              throw new Error(
                'oneTimeNotifToken can only be used to send one message'
              );
            }

            isOneTimeTokenUsed = true;
            body.recipient = {
              one_time_notif_token: options.oneTimeNotifToken,
            };
          }
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
          relative_url: relativeUrl || PATH_MESSAGES,
          body,
        },
        key: channel.uid,
        assetTag,
        fileData,
        fileInfo,
      };
    }

    return jobs;
  };
};

export const createAttachmentJobs = (
  _target: null,
  segments: DispatchableSegment<MessengerSegmentValue>[]
): MetaApiJob[] => {
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
      fileData: value[ATTACHMENT_DATA],
      fileInfo: value[ATTACHMENT_INFO],
      request: {
        method: POST,
        relative_url: PATH_MESSAGE_ATTACHMENTS,
        body,
      },
    },
  ];
};
