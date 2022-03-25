import { formatNode } from '@machinat/core/utils';
import type { DispatchableSegment } from '@machinat/core/engine';
import TweetTarget from './TweetTarget';
import TwitterChat from './Chat';
import createDmSegmentValue from './utils/createDmSegmentValue';
import createTweetSegmentValue from './utils/createTweetSegmentValue';
import annotateTweetMedia from './utils/annotateTweetMedia';
import splitTweetText from './utils/splitTweetText';
import type { TwitterSegmentValue, TwitterJob, TweetResult } from './types';

const useCreatedTweetTarget = (agentId: string) => (_, result: TweetResult) => {
  return new TweetTarget(agentId, result.data.id);
};
const useCurrentTarget = (curTarget: TweetTarget) => curTarget;

const plainTweetJob = (
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
  ({ key }: { key: string }) =>
  (
    target: TweetTarget,
    segments: DispatchableSegment<TwitterSegmentValue>[]
  ): TwitterJob[] => {
    const jobs: TwitterJob[] = [];
    let lastPlainTweet: null | TwitterJob = null;

    segments.forEach((segment) => {
      if (segment.type === 'text') {
        const splietdContent = splitTweetText(segment.value);
        const newJobs = splietdContent?.map((text) =>
          plainTweetJob(target.agentId, target, key, text)
        );

        if (newJobs) {
          jobs.push(...newJobs);
          lastPlainTweet = newJobs[newJobs.length - 1];
        }
      } else if (segment.value.type === 'tweet') {
        const { request, mediaSources } = segment.value;
        jobs.push({
          target,
          key,
          request,
          mediaSources,
          refreshTarget: useCreatedTweetTarget(target.agentId),
          accomplishRequest: segment.value.accomplishRequest,
        });

        lastPlainTweet = null;
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
          !lastPlainTweet ||
          lastPlainTweet.request.parameters.poll ||
          lastPlainTweet.request.parameters.quote_tweet_id ||
          (lastPlainTweet.mediaSources &&
            (media.type !== 'photo' ||
              lastPlainTweet.mediaSources[0].type !== 'photo' ||
              lastPlainTweet.mediaSources.length >= 4))
        ) {
          lastPlainTweet = plainTweetJob(target.agentId, target, key);
          jobs.push(lastPlainTweet);
        }

        if (!lastPlainTweet.mediaSources) {
          lastPlainTweet.mediaSources = [];
        }
        lastPlainTweet.mediaSources.push(annotateTweetMedia(media));
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
