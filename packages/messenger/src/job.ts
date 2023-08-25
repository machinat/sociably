import { formatNode } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import type { MetaApiJob, MetaApiChannel } from '@sociably/meta-api';
import {
  PATH_MESSAGES,
  PATH_MESSAGE_ATTACHMENTS,
  MESSENGER_MESSAGING_TYPE_RESPONSE,
} from './constant.js';
import type {
  MessengerSegmentValue,
  MessagingOptions,
  AttachFileValue,
  BaseSegmentValue,
  MessengerChat,
} from './types.js';

const POST = 'POST';

export const createChatJobs = <
  Channel extends MetaApiChannel,
  Chat extends MessengerChat,
>(
  channel: Channel,
  options?: MessagingOptions
) => {
  let isOneTimeTokenUsed = false;

  return (
    chat: Chat,
    segments: DispatchableSegment<MessengerSegmentValue>[]
  ): MetaApiJob[] => {
    const jobs: MetaApiJob[] = new Array(segments.length);

    for (let i = 0; i < segments.length; i += 1) {
      const { node, value } = segments[i];

      let params: Record<string, unknown>;
      let apiUrl: string;
      let file: undefined | AttachFileValue;
      let assetTag: undefined | string;

      if (typeof value === 'string') {
        apiUrl = PATH_MESSAGES;
        params = { message: { text: value } };
      } else if (typeof value === 'object' && value.type === 'message') {
        ({ params, assetTag } = value as BaseSegmentValue);
        apiUrl = value.apiPath;
        file = value.attachFile;
      } else {
        throw new TypeError(
          `${formatNode(node)} is invalid to be sent in a chat`
        );
      }

      params.recipient = chat.target;

      if (options && apiUrl === PATH_MESSAGES) {
        if (params.message) {
          if (params.messaging_type === undefined) {
            params.messaging_type =
              options.messagingType || MESSENGER_MESSAGING_TYPE_RESPONSE;
            params.tag = options.tag;
          }

          params.notification_type =
            params.notification_type || options.notificationType;

          params.persona_id = params.persona_id || options.personaId;

          if (options.oneTimeNotifToken) {
            if (isOneTimeTokenUsed) {
              throw new Error(
                'oneTimeNotifToken can only be used to send one message'
              );
            }

            isOneTimeTokenUsed = true;
            params.recipient = {
              one_time_notif_token: options.oneTimeNotifToken,
            };
          }
        } else if (
          params.sender_action === 'typing_on' ||
          params.sender_action === 'typing_off'
        ) {
          params.persona_id = params.persona_id || options.personaId;
        }
      }

      jobs[i] = {
        request: {
          method: POST,
          url: apiUrl,
          params,
        },
        key: chat.uid,
        channel,
        file,
        assetTag,
      };
    }

    return jobs;
  };
};

export const createUploadChatAttachmentJobs =
  <Channel extends MetaApiChannel>({ platform }: { platform?: string } = {}) =>
  (
    channel: Channel,
    segments: DispatchableSegment<MessengerSegmentValue>[]
  ): MetaApiJob[] => {
    if (segments.length !== 1) {
      throw new TypeError('more than 1 message received');
    }

    const [segment] = segments;
    const { type: segType, value, node } = segment;
    if (
      (segType !== 'unit' && segType !== 'raw') ||
      value.type !== 'message' ||
      !('message' in value.params) ||
      !value.params.message.attachment
    ) {
      throw new TypeError(
        `${formatNode(node || value)} is not valid attachment message`
      );
    }

    const { params, attachFile, assetTag } = value;
    const attachmentType = params.message.attachment.type;
    if (
      attachmentType !== 'image' &&
      attachmentType !== 'video' &&
      attachmentType !== 'audio' &&
      attachmentType !== 'file'
    ) {
      throw new TypeError(
        `invalid attachment type "${attachmentType}" to be uploaded`
      );
    }

    return [
      {
        channel,
        file: attachFile,
        request: {
          method: POST,
          url: PATH_MESSAGE_ATTACHMENTS,
          params: { ...params, platform },
        },
        assetTag,
      },
    ];
  };
