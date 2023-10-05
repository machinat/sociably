/* eslint-disable import/prefer-default-export */
import type { DispatchableSegment } from '@sociably/core/engine';
import { formatNode, getTimeId } from '@sociably/core/utils';
import type { MetaApiJob, AccomplishRequestFn } from '@sociably/meta-api';
import InstagramAgent from './Agent.js';
import type { InstagramSegmentValue } from './types.js';

const accomplishPostCarouselRequest: AccomplishRequestFn = (
  request,
  keys,
  getResult,
) => {
  const carouselMediaIds = keys.map((key) => getResult(key, '$.id'));
  return {
    ...request,
    params: {
      ...request.params,
      children: carouselMediaIds,
    },
  };
};

const accomplishPublishRequest: AccomplishRequestFn = (
  request,
  [key],
  getResult,
) => ({
  ...request,
  params: {
    ...request.params,
    creation_id: getResult(key, '$.id'),
  },
});

export const createPostJobs =
  (userAccessToken: string) =>
  (
    agent: InstagramAgent,
    segments: DispatchableSegment<InstagramSegmentValue>[],
  ): MetaApiJob[] => {
    if (segments.length !== 1) {
      throw new TypeError(
        'media post content should contain only 1 post element',
      );
    }

    const [segment] = segments;
    const { type: segType, value, node } = segment;

    if (segType === 'text' || value.type !== 'post') {
      throw new TypeError(
        `invalid post media content ${formatNode(node || value)}`,
      );
    }

    const jobBase = {
      channel: agent,
      key: agent.uid,
      accessToken: userAccessToken,
    };

    const carouselItemJobs = value.carouselItems?.map<MetaApiJob>((item) => ({
      ...jobBase,
      request: {
        method: 'POST',
        url: `${agent.id}/media`,
        params: item.params,
      },
      registerResult: getTimeId(),
    }));

    const containerResultKey = getTimeId();
    return [
      ...(carouselItemJobs || []),
      {
        ...jobBase,
        request: {
          method: 'POST',
          url: `${agent.id}/media`,
          params: value.params,
        },
        registerResult: containerResultKey,
        consumeResult: carouselItemJobs
          ? {
              keys: carouselItemJobs.map((job) => job.registerResult as string),
              accomplishRequest: accomplishPostCarouselRequest,
            }
          : undefined,
      },
      {
        ...jobBase,
        request: {
          method: 'POST',
          url: `${agent.id}/media_publish`,
          params: { creation_id: '' },
        },
        consumeResult: {
          keys: [containerResultKey],
          accomplishRequest: accomplishPublishRequest,
        },
      },
    ];
  };
