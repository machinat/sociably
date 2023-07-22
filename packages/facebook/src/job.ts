import { formatNode, getTimeId } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import type { MetaApiJob, MetaApiJobRequest } from '@sociably/meta-api';
import FacebookPage from './Page.js';
import type InteractTarget from './InteractTarget.js';
import { PATH_FEED, PATH_PHOTOS } from './constant.js';
import type { FacebookSegmentValue } from './types.js';

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
