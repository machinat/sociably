import TweetTarget from '../TweetTarget.js';
import type { MediaAttachment, TweetSegmentValue } from '../types.js';
import annotateTweetMedia from './annotateTweetMedia.js';

const createTweetSegmentValue = (
  params: Record<string, any>,
  media?: null | MediaAttachment[],
  dmLink?:
    | boolean
    | string
    | { recipientId?: string; text?: string; welcomeMessageId?: string },
): TweetSegmentValue => ({
  type: 'tweet',
  request: {
    method: 'POST',
    url: '2/tweets',
    params,
  },
  mediaSources: media
    ? media.map(({ source, type }) => annotateTweetMedia(type, source))
    : null,
  accomplishRequest: (target: TweetTarget, request, mediaIds) => ({
    ...request,
    params: {
      ...request.params,
      reply: target.tweetId
        ? {
            in_reply_to_tweet_id: target.tweetId,
            exclude_reply_user_ids:
              request.params.reply?.exclude_reply_user_ids,
          }
        : undefined,
      media: mediaIds
        ? {
            media_ids: mediaIds,
            tagged_user_ids: request.params.media?.tagged_user_ids,
          }
        : undefined,
      direct_message_deep_link:
        typeof dmLink === 'string'
          ? dmLink
          : typeof dmLink === 'object'
          ? `https://twitter.com/messages/compose?recipient_id=${
              dmLink.recipientId || target.agentId
            }${
              dmLink.welcomeMessageId
                ? `&welcome_message_id=${dmLink.welcomeMessageId}`
                : ''
            }${dmLink.text ? `&text=${encodeURIComponent(dmLink.text)}` : ''}`
          : dmLink
          ? `https://twitter.com/messages/compose?recipient_id=${target.agentId}`
          : undefined,
    },
  }),
});

export default createTweetSegmentValue;
