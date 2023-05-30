import { formatNode } from '@sociably/core/utils';
import type { DispatchableSegment } from '@sociably/core/engine';
import TweetTarget from './TweetTarget.js';
import TwitterChat from './Chat.js';
import createDmSegmentValue from './utils/createDmSegmentValue.js';
import createTweetSegmentValue from './utils/createTweetSegmentValue.js';
import annotateTweetMedia from './utils/annotateTweetMedia.js';
import splitTweetText from './utils/splitTweetText.js';
import type {
  MediaType,
  TwitterSegmentValue,
  DirectMessageSegmentValue,
  TwitterJob,
  TweetResult,
} from './types.js';

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
    asApplication: false,
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
    let lastOpenTweet: null | TwitterJob = null;
    let lastTweetMediaType: undefined | MediaType;

    segments.forEach((segment) => {
      if (segment.type === 'text') {
        const splitedContent = splitTweetText(segment.value);
        const newJobs = splitedContent?.map((text) =>
          plainTweetJob(target.agentId, target, key, text)
        );

        if (newJobs) {
          jobs.push(...newJobs);
          lastOpenTweet = newJobs[newJobs.length - 1];
          lastTweetMediaType = undefined;
        }
      } else if (segment.value.type === 'tweet') {
        const { request, mediaSources } = segment.value;
        jobs.push({
          target,
          key,
          request,
          mediaSources,
          asApplication: false,
          refreshTarget: useCreatedTweetTarget(target.agentId),
          accomplishRequest: segment.value.accomplishRequest,
        });

        lastOpenTweet = null;
      } else if (segment.value.type === 'action') {
        const { request, mediaSources } = segment.value;
        jobs.push({
          target,
          key,
          request,
          mediaSources,
          asApplication: false,
          refreshTarget: useCurrentTarget,
          accomplishRequest: segment.value.accomplishRequest,
        });
      } else if (segment.value.type === 'media') {
        const { type: mediaType, source } = segment.value.attachment;
        if (
          !lastOpenTweet ||
          lastOpenTweet.request.params.poll ||
          lastOpenTweet.request.params.quote_tweet_id ||
          (lastOpenTweet.mediaSources &&
            (mediaType !== 'photo' ||
              lastTweetMediaType !== 'photo' ||
              lastOpenTweet.mediaSources.length >= 4))
        ) {
          lastOpenTweet = plainTweetJob(target.agentId, target, key);
          jobs.push(lastOpenTweet);
        }

        if (!lastOpenTweet.mediaSources) {
          lastOpenTweet.mediaSources = [];
        }
        lastOpenTweet.mediaSources.push(annotateTweetMedia(mediaType, source));
        lastTweetMediaType = mediaType;
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
        key,
        request,
        mediaSources,
        accomplishRequest,
        asApplication: false,
        refreshTarget: null,
      });
    } else if (segment.value.type === 'dm' || segment.value.type === 'action') {
      const { request, mediaSources, accomplishRequest } = segment.value;
      jobs.push({
        target: chat,
        key,
        request,
        accomplishRequest,
        mediaSources,
        refreshTarget: null,
        asApplication: false,
      });
    } else if (segment.value.type === 'media') {
      const { request, mediaSources, accomplishRequest } = createDmSegmentValue(
        undefined,
        segment.value.attachment
      );

      jobs.push({
        target: chat,
        key,
        request,
        mediaSources,
        accomplishRequest,
        refreshTarget: null,
        asApplication: false,
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

export const createWelcomeMessageJobs = (name?: string) => {
  let isCreated = false;

  return (
    _targe: TweetTarget,
    segments: DispatchableSegment<TwitterSegmentValue>[]
  ): TwitterJob[] => {
    if (isCreated || segments.length > 1) {
      throw new Error('welcome message should contain only one direct message');
    }
    isCreated = true;

    const segment = segments[0];
    let dmSegValue: DirectMessageSegmentValue;

    if (segment.type === 'text') {
      dmSegValue = createDmSegmentValue(segment.value);
    } else if (segment.value.type === 'media') {
      dmSegValue = createDmSegmentValue(undefined, segment.value.attachment);
    } else if (segment.value.type === 'dm') {
      dmSegValue = segment.value;
    } else {
      throw new Error(
        `${formatNode(segment.node)} cannot be used as welcome message`
      );
    }

    return [
      {
        // HACK: to pass accomplishRequest
        target: new TwitterChat('', ''),
        key: undefined,
        request: dmSegValue.request,
        mediaSources: dmSegValue.mediaSources,
        accomplishRequest: (target, request, mediaResults) => {
          const dmRequest = dmSegValue.accomplishRequest
            ? dmSegValue.accomplishRequest(target, request, mediaResults)
            : request;

          return {
            method: 'POST',
            url: '1.1/direct_messages/welcome_messages/new.json',
            params: {
              welcome_message: {
                name,
                message_data:
                  dmRequest.params.event.message_create.message_data,
              },
            },
          };
        },
        refreshTarget: null,
        asApplication: false,
      },
    ];
  };
};
