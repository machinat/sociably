import { formatNode, getTimeId } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import type {
  MetaApiJob,
  MetaBatchRequest,
  FileInfo,
} from '@sociably/meta-api';
import type { FacebookSegmentValue, MessagingOptions } from './types';
import type FacebookChat from './Chat';
import PageFeed from './PageFeed';
import type ObjectTarget from './ObjectTarget';
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
    channel: FacebookChat,
    segments: DispatchableSegment<FacebookSegmentValue>[]
  ): MetaApiJob[] => {
    const jobs: MetaApiJob[] = new Array(segments.length);

    for (let i = 0; i < segments.length; i += 1) {
      const { node, value } = segments[i];

      let body: { [k: string]: unknown };
      let relativeUrl: string;
      let assetTag: undefined | string;
      let fileData: undefined | string | Buffer | NodeJS.ReadableStream;
      let fileInfo: undefined | FileInfo;

      if (typeof value === 'string') {
        relativeUrl = PATH_MESSAGES;
        body = { message: { text: value } };
      } else if (typeof value === 'object' && value.type === 'message') {
        body = value.params;
        relativeUrl = value.apiPath;
        assetTag = value.attachFile?.assetTag;
        fileData = value.attachFile?.data;
        fileInfo = value.attachFile?.info;
      } else {
        throw new TypeError(
          `${formatNode(node)} is invalid to be sent in a chat`
        );
      }

      body.recipient = channel.target;

      if (options && relativeUrl === PATH_MESSAGES) {
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
          relative_url: relativeUrl,
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

export const createChatAttachmentJobs = (
  page: PageFeed,
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
      fileData: value.attachFile?.data,
      fileInfo: value.attachFile?.info,
      assetTag: value.attachFile?.assetTag,
      request: {
        method: POST,
        relative_url: PATH_MESSAGE_ATTACHMENTS,
        body: value.params,
      },
    },
  ];
};

export const createPostJobs = (
  feedOrAlbum: PageFeed | ObjectTarget,
  segments: DispatchableSegment<FacebookSegmentValue>[]
): MetaApiJob[] => {
  if (segments.length !== 1) {
    throw new TypeError('more than 1 element received');
  }

  const [segment] = segments;
  const { type: segType, value, node } = segment;

  if (segType === 'text') {
    return [
      {
        request: {
          method: 'POST',
          relative_url: PATH_FEED,
          body: { message: value },
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
        request: {
          method: 'POST',
          relative_url:
            feedOrAlbum instanceof PageFeed
              ? PATH_PHOTOS
              : `${feedOrAlbum.id}/photos`,
          body: value.params,
        },
        fileData: value.attachFile?.data,
        fileInfo: value.attachFile?.info,
        assetTag: value.attachFile?.assetTag,
      },
    ];
  }

  const { params, photos, attachFile } = value;
  const postJob: MetaApiJob = {
    request: {
      method: 'POST',
      relative_url: PATH_FEED,
      body: params,
    },
    fileData: attachFile?.data,
    fileInfo: attachFile?.info,
    assetTag: attachFile?.assetTag,
  };

  if (!photos) {
    return [postJob];
  }

  const photoResultKeys = photos.map(() => getTimeId());
  postJob.consumeResult = {
    keys: photoResultKeys,
    accomplishRequest: (request, keys, getResult) => ({
      ...request,
      body: {
        ...request.body,
        attached_media: keys.map((key) => ({
          media_fbid: getResult(key, '$.id'),
        })),
      },
    }),
  };

  const photoJobs = photos.map((photoValue, i) => ({
    request: {
      method: 'POST',
      relative_url:
        feedOrAlbum instanceof PageFeed
          ? PATH_PHOTOS
          : `${feedOrAlbum.id}/photos`,
      body: {
        ...photoValue.params,
        published: false,
        temporary: value.params.scheduled_publish_time ? true : undefined,
      },
    },
    fileData: photoValue.attachFile?.data,
    fileInfo: photoValue.attachFile?.info,
    assetTag: photoValue.attachFile?.assetTag,
    registerResult: photoResultKeys[i],
  }));
  return [...photoJobs, postJob];
};

const accomplishContiuousCommentRequest = (
  request: MetaBatchRequest,
  [lastCommentKey]: [string],
  getResult: (key: string, path: string) => string
) => ({
  ...request,
  relative_url: `${getResult(lastCommentKey, '$.id')}/comments`,
});

const accomplishPhotoCommentRequest = (
  request: MetaBatchRequest,
  [photoKey, lastCommentKey]: [string] | [string, string],
  getResult: (key: string, path: string) => string
) => {
  const requestWithPhotoId = {
    ...request,
    body: {
      ...request.body,
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
  target: ObjectTarget,
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
        request: {
          method: 'POST',
          relative_url: initialCommentApiPath,
          body: { message: segValue },
        },
        registerResult: registerResultKey,
        consumeResult: consumeLastResult,
      });
    } else if (segValue.type === 'comment') {
      const { params, photo } = segValue;

      const photoJob = photo
        ? {
            request: {
              method: 'POST',
              relative_url: PATH_PHOTOS,
              body: photo.params,
            },
            fileData: photo.attachFile?.data,
            fileInfo: photo.attachFile?.info,
            assetTag: photo.attachFile?.assetTag,
            registerResult: getTimeId(),
          }
        : null;

      const commentJob = {
        request: {
          method: 'POST',
          relative_url: initialCommentApiPath,
          body: { ...params },
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
