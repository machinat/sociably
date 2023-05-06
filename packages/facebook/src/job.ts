import { formatNode, getTimeId } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import type { MetaApiJob, MetaApiJobRequest } from '@sociably/meta-api';
import type {
  FacebookSegmentValue,
  MessagingOptions,
  AttachFileValue,
} from './types';
import type FacebookChat from './Chat';
import FacebookPage from './Page';
import type InteractTarget from './InteractTarget';
import {
  PATH_MESSAGES,
  PATH_MESSAGE_ATTACHMENTS,
  PATH_FEED,
  PATH_PHOTOS,
  MESSENGER_MESSAGING_TYPE_RESPONSE,
} from './constant';

const POST = 'POST';

export const createChatJobs = (options?: MessagingOptions) => {
  let isOneTimeTokenUsed = false;

  return (
    chat: FacebookChat,
    segments: DispatchableSegment<FacebookSegmentValue>[]
  ): MetaApiJob[] => {
    const jobs: MetaApiJob[] = new Array(segments.length);

    for (let i = 0; i < segments.length; i += 1) {
      const { node, value } = segments[i];

      let params: { [k: string]: unknown };
      let apiUrl: string;
      let file: undefined | AttachFileValue;

      if (typeof value === 'string') {
        apiUrl = PATH_MESSAGES;
        params = { message: { text: value } };
      } else if (typeof value === 'object' && value.type === 'message') {
        ({ params } = value);
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
        channel: chat.page,
        file,
      };
    }

    return jobs;
  };
};

export const createChatAttachmentJobs = (
  page: FacebookPage,
  segments: DispatchableSegment<FacebookSegmentValue>[]
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

  const attachmentType = value.params.message.attachment.type;
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
      channel: page,
      file: value.attachFile,
      request: {
        method: POST,
        url: PATH_MESSAGE_ATTACHMENTS,
        params: value.params,
      },
    },
  ];
};

export const createPostJobs = (
  feedOrAlbum: FacebookPage | InteractTarget,
  segments: DispatchableSegment<FacebookSegmentValue>[]
): MetaApiJob[] => {
  if (segments.length !== 1) {
    throw new TypeError('more than 1 element received');
  }

  const channel =
    feedOrAlbum instanceof FacebookPage ? feedOrAlbum : feedOrAlbum.page;

  const [segment] = segments;
  const { type: segType, value, node } = segment;

  if (segType === 'text') {
    return [
      {
        channel,
        request: {
          method: 'POST',
          url: PATH_FEED,
          params: { message: value },
        },
      },
    ];
  }

  if (
    value.type !== 'page' ||
    (value.apiPath !== PATH_FEED && value.apiPath !== PATH_PHOTOS)
  ) {
    throw new TypeError(`invalid feed element ${formatNode(node || value)}`);
  }

  if (value.apiPath === PATH_PHOTOS) {
    return [
      {
        channel,
        request: {
          method: 'POST',
          url:
            feedOrAlbum instanceof FacebookPage
              ? PATH_PHOTOS
              : `${feedOrAlbum.id}/photos`,
          params: value.params,
        },
        file: value.attachFile,
      },
    ];
  }

  const { params, photos, attachFile } = value;
  const postJob: MetaApiJob = {
    channel,
    request: {
      method: 'POST',
      url: PATH_FEED,
      params,
    },
    file: attachFile,
  };

  if (!photos) {
    return [postJob];
  }

  const photoResultKeys = photos.map(() => getTimeId());
  postJob.consumeResult = {
    keys: photoResultKeys,
    accomplishRequest: (request, keys, getResult) => ({
      ...request,
      params: {
        ...request.params,
        attached_media: keys.map((key) => ({
          media_fbid: getResult(key, '$.id'),
        })),
      },
    }),
  };

  const photoJobs = photos.map((photoValue, i) => ({
    channel,
    request: {
      method: 'POST',
      url:
        feedOrAlbum instanceof FacebookPage
          ? PATH_PHOTOS
          : `${feedOrAlbum.id}/photos`,
      params: {
        ...photoValue.params,
        published: false,
        temporary: value.params.scheduled_publish_time ? true : undefined,
      },
    },
    file: photoValue.attachFile,
    registerResult: photoResultKeys[i],
  }));
  return [...photoJobs, postJob];
};

const accomplishContiuousCommentRequest = (
  request: MetaApiJobRequest,
  [lastCommentKey]: [string],
  getResult: (key: string, path: string) => string
) => ({
  ...request,
  url: `${getResult(lastCommentKey, '$.id')}/comments`,
});

const accomplishPhotoCommentRequest = (
  request: MetaApiJobRequest,
  [photoKey, lastCommentKey]: [string] | [string, string],
  getResult: (key: string, path: string) => string
) => {
  const requestWithPhotoId = {
    ...request,
    params: {
      ...request.params,
      attachment_id: getResult(photoKey, '$.id'),
    },
  };
  return lastCommentKey
    ? accomplishContiuousCommentRequest(
        requestWithPhotoId,
        [lastCommentKey],
        getResult
      )
    : requestWithPhotoId;
};

export const createInteractJobs = (
  target: InteractTarget,
  segments: DispatchableSegment<FacebookSegmentValue>[]
): MetaApiJob[] => {
  const initialCommentApiPath = `${target.id}/comments`;
  const jobs: MetaApiJob[] = [];

  let lastRegisteredResult: undefined | string;

  for (const [i, segment] of segments.entries()) {
    const registerResultKey =
      i === segments.length - 1 ? undefined : getTimeId();

    const consumeLastResult: MetaApiJob['consumeResult'] = lastRegisteredResult
      ? {
          keys: [lastRegisteredResult],
          accomplishRequest: accomplishContiuousCommentRequest,
        }
      : undefined;

    const { type: segType, value: segValue, node } = segment;

    if (segType === 'text') {
      jobs.push({
        channel: target.page,
        request: {
          method: 'POST',
          url: initialCommentApiPath,
          params: { message: segValue },
        },
        registerResult: registerResultKey,
        consumeResult: consumeLastResult,
      });
    } else if (segValue.type === 'comment') {
      const { params, photo } = segValue;

      const photoJob = photo
        ? {
            channel: target.page,
            request: {
              method: 'POST',
              url: PATH_PHOTOS,
              params: photo.params,
            },
            file: photo.attachFile,
            registerResult: getTimeId(),
          }
        : null;

      const commentJob = {
        channel: target.page,
        request: {
          method: 'POST',
          url: initialCommentApiPath,
          params: { ...params },
        },
        registerResult: registerResultKey,
        consumeResult: photoJob
          ? {
              keys: lastRegisteredResult
                ? [photoJob.registerResult, lastRegisteredResult]
                : [photoJob.registerResult],
              accomplishRequest: accomplishPhotoCommentRequest,
            }
          : consumeLastResult,
      };

      if (photoJob) {
        jobs.push(photoJob);
      }
      jobs.push(commentJob);
    } else {
      throw new TypeError(`invalid comment content ${formatNode(node)}`);
    }
    lastRegisteredResult = registerResultKey;
  }
  return jobs;
};
