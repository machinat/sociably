import { formatNode } from '@machinat/core/utils';
import type { DispatchableSegment } from '@machinat/core/engine';
import TweetTarget from './TweetTarget';
import TwitterChat from './Chat';
import type {
  TwitterSegmentValue,
  TwitterJob,
  TweetResult,
  TwitterApiRequest,
} from './types';

type CreateTweetJobOptions = { key: string; agentId: string };

const useCreatedTweetTarget = (agentId: string) => (_, result: TweetResult) => {
  return new TweetTarget(agentId, result.data.id);
};
const useCurrentTarget = (curTarget: null | TweetTarget) => curTarget;

const accomplishTweetRequest = (
  target: null | TweetTarget,
  request: TwitterApiRequest,
  mediaIds: string[]
) => {
  const { method, href, parameters } = request;
  return {
    method,
    href,
    parameters: {
      ...parameters,
      reply: target
        ? {
            in_reply_to_tweet_id: target.id,
            exclude_reply_user_ids: parameters.reply?.exclude_reply_user_ids,
          }
        : undefined,
      media: mediaIds
        ? {
            media_ids: mediaIds,
            tagged_user_ids: parameters.media?.tagged_user_ids,
          }
        : undefined,
    },
  };
};

const tweetJob = (
  agentId: string,
  target: null | TweetTarget,
  key: string,
  text?: string
) => ({
  target,
  key,
  refreshTarget: useCreatedTweetTarget(agentId),
  request: {
    method: 'POST',
    href: '2/tweets',
    parameters: { text },
  },
  accomplishRequest: accomplishTweetRequest,
  mediaSources: null,
});

export const createTweetJobs =
  ({ key, agentId }: CreateTweetJobOptions) =>
  (
    target: null | TweetTarget,
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
          refreshTarget: useCreatedTweetTarget(agentId),
          request,
          accomplishRequest:
            segment.value.accomplishRequest || accomplishTweetRequest,
          mediaSources,
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
        lastTweetJob.mediaSources.push(media);
      } else if (segment.value.type === 'poll') {
        if (
          !lastTweetJob ||
          lastTweetJob.request.parameters.poll ||
          lastTweetJob.request.parameters.quote_tweet_id ||
          lastTweetJob.mediaSources
        ) {
          lastTweetJob = tweetJob(agentId, target, key, '');
          jobs.push(lastTweetJob);
        }

        const { options, durationMinutes } = segment.value.poll;
        lastTweetJob.request.parameters.poll = {
          options,
          duration_minutes: durationMinutes,
        };
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
      jobs.push({
        target: chat,
        refreshTarget: null,
        key,
        request: {
          method: 'POST',
          href: '1.1/direct_messages/events/new.json',
          parameters: {
            event: {
              type: 'message_create',
              message_create: {
                target: { recipient_id: chat.id },
                message_data: { text: segment.value },
              },
            },
          },
        },
        mediaSources: null,
        accomplishRequest: null,
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
      const { media } = segment.value;
      jobs.push({
        target: chat,
        refreshTarget: null,
        key,
        request: {
          method: 'POST',
          href: '1.1/direct_messages/events/new.json',
          parameters: {
            event: {
              type: 'message_create',
              message_create: {
                target: { recipient_id: chat.id },
                message_data: {
                  text: '',
                  attachment: {
                    type: 'media',
                    media: { id: undefined },
                  },
                },
              },
            },
          },
        },
        mediaSources: [
          media.sourceType === 'id'
            ? media
            : {
                ...media,
                parameters: {
                  ...media.parameters,
                  media_category:
                    media.type === 'photo'
                      ? 'dm_image'
                      : media.type === 'video'
                      ? 'dm_video'
                      : media.type === 'animated_gif'
                      ? 'dm_gif'
                      : undefined,
                },
              },
        ],
        accomplishRequest: (
          _,
          { method, href, parameters },
          [mediaId]: string[]
        ) => {
          // eslint-disable-next-line no-param-reassign
          parameters.event.message_create.message_data.attachment.media.id =
            mediaId;
          return { method, href, parameters };
        },
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
