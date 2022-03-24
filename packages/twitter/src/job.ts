import { formatNode } from '@machinat/core/utils';
import type { DispatchableSegment } from '@machinat/core/engine';
import TweetTarget from './TweetTarget';
import TwitterChat from './Chat';
import {
  createDmSegmentValue,
  createTweetSegmentValue,
  annotateTweetMedia,
} from './utils';
import type { TwitterSegmentValue, TwitterJob, TweetResult } from './types';

type CreateTweetJobOptions = { key: string; agentId: string };

const useCreatedTweetTarget = (agentId: string) => (_, result: TweetResult) => {
  return new TweetTarget(agentId, result.data.id);
};
const useCurrentTarget = (curTarget: TweetTarget) => curTarget;

const tweetJob = (
  agentId: string,
  target: TweetTarget,
  key: string,
  text?: string
) => {
  const { request, accomplishRequest, mediaSources } = createTweetSegmentValue({
    text,
  });
  return {
    target,
    key,
    request,
    accomplishRequest,
    mediaSources,
    refreshTarget: useCreatedTweetTarget(agentId),
  };
};

export const createTweetJobs =
  ({ key, agentId }: CreateTweetJobOptions) =>
  (
    target: TweetTarget,
    segments: DispatchableSegment<TwitterSegmentValue>[]
  ): TwitterJob[] => {
    const jobs: TwitterJob[] = [];
    let lastTweetJob: null | TwitterJob = null;

    segments.forEach((segment) => {
      if (segment.type === 'text') {
        lastTweetJob = tweetJob(agentId, target, key, segment.value);

        jobs.push(lastTweetJob);
      } else if (segment.value.type === 'tweet') {
        const { request, mediaSources } = segment.value;
        lastTweetJob = {
          target,
          key,
          request,
          mediaSources,
          refreshTarget: useCreatedTweetTarget(agentId),
          accomplishRequest: segment.value.accomplishRequest,
        };

        jobs.push(lastTweetJob);
      } else if (segment.value.type === 'action') {
        const { request, mediaSources } = segment.value;
        jobs.push({
          target,
          key,
          refreshTarget: useCurrentTarget,
          request,
          accomplishRequest: segment.value.accomplishRequest,
          mediaSources,
        });
      } else if (segment.value.type === 'media') {
        const { media } = segment.value;
        if (
          !lastTweetJob ||
          lastTweetJob.request.parameters.poll ||
          lastTweetJob.request.parameters.quote_tweet_id ||
          (lastTweetJob.mediaSources &&
            (media.type !== 'photo' ||
              lastTweetJob.mediaSources[0].type !== 'photo' ||
              lastTweetJob.mediaSources.length >= 4))
        ) {
          lastTweetJob = tweetJob(agentId, target, key);
          jobs.push(lastTweetJob);
        }

        if (!lastTweetJob.mediaSources) {
          lastTweetJob.mediaSources = [];
        }
        lastTweetJob.mediaSources.push(annotateTweetMedia(media));
      } else {
        throw new Error(
          `direct message feature ${formatNode(
            segment.node
          )} cannot be used while tweeting`
        );
      }
    });

    return jobs;
  };

export const createDirectMessageJobs = (
  chat: TwitterChat,
  segments: DispatchableSegment<TwitterSegmentValue>[]
): TwitterJob[] => {
  const jobs: TwitterJob[] = [];
  const key = chat.uid;

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      const { request, mediaSources, accomplishRequest } = createDmSegmentValue(
        segment.value
      );

      jobs.push({
        target: chat,
        refreshTarget: null,
        key,
        request,
        mediaSources,
        accomplishRequest,
      });
    } else if (segment.value.type === 'dm' || segment.value.type === 'action') {
      const { request, mediaSources, accomplishRequest } = segment.value;
      jobs.push({
        target: chat,
        refreshTarget: null,
        key,
        request,
        accomplishRequest,
        mediaSources,
      });
    } else if (segment.value.type === 'media') {
      const { request, mediaSources, accomplishRequest } = createDmSegmentValue(
        undefined,
        segment.value.media
      );

      jobs.push({
        target: chat,
        refreshTarget: null,
        key,
        request,
        mediaSources,
        accomplishRequest,
      });
    } else {
      throw new Error(
        `tweeting feature ${formatNode(
          segment.node
        )} cannot be used while tweeting`
      );
    }
  });

  return jobs;
};
