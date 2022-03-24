import { annotateNativeComponent } from '@machinat/core/renderer';
import TwitterUser from './User';
import TwitterChat from './Chat';
import TweetTarget from './TweetTarget';
import { TWITTER } from './constant';
import type {
  RawEntities,
  UrlEntity,
  MentionEntity,
  RawMedia,
  Media,
  MediaSource,
  DirectMessageSegmentValue,
  TweetSegmentValue,
} from './types';

export const makeTwitterComponent = annotateNativeComponent(TWITTER);

export const polishMentionEntity = (
  raw: RawEntities['user_mentions'][number]
): MentionEntity => ({
  user: new TwitterUser(raw.id_str),
  id: raw.id_str,
  name: raw.name,
  screenName: raw.screen_name,
  indices: raw.indices,
});

export const polishUrlEntity = (
  raw: RawEntities['urls'][number]
): UrlEntity => ({
  url: raw.url,
  displayUrl: raw.display_url,
  expandedUrl: raw.expanded_url,
  indices: raw.indices,
});

export const polishMedia = (raw: RawMedia): Media => {
  const videoInfo = raw.video_info;
  return {
    id: raw.id_str,
    type: raw.type,
    inlineUrl: raw.url,
    displayUrl: raw.display_url,
    expandedUrl: raw.expanded_url,
    indices: raw.indices,
    downloadUrl: raw.media_url_https,
    sizes: raw.sizes,
    sourceStatusId: raw.source_status_id_str,
    videoInfo: videoInfo
      ? {
          aspectRatio: videoInfo.aspect_ratio,
          durationMs: videoInfo.duration_millis,
          variants: videoInfo.variants.map((rawVariant) => ({
            url: rawVariant.url,
            bitrate: rawVariant.bitrate,
            contentType: rawVariant.content_type,
          })),
        }
      : null,
    additionalMediaInfo: raw.additional_media_info || null,
  } as Media;
};

export const annotateDmMedia = (media: MediaSource): MediaSource =>
  media.sourceType === 'id'
    ? media
    : {
        ...media,
        parameters: {
          ...media.parameters,
          media_category:
            media.parameters.media_category ||
            (media.type === 'photo'
              ? 'dm_image'
              : media.type === 'video'
              ? 'dm_video'
              : media.type === 'animated_gif'
              ? 'dm_gif'
              : undefined),
        },
      };

export const annotateTweetMedia = (media: MediaSource): MediaSource =>
  media.sourceType === 'id'
    ? media
    : {
        ...media,
        parameters: {
          ...media.parameters,
          media_category:
            media.parameters.media_category ||
            (media.type === 'photo'
              ? 'tweet_image'
              : media.type === 'video'
              ? 'tweet_video'
              : media.type === 'animated_gif'
              ? 'tweet_gif'
              : undefined),
        },
      };

export const createDmSegmentValue = (
  text?: string,
  media?: MediaSource
): DirectMessageSegmentValue => ({
  type: 'dm',
  request: {
    method: 'POST',
    href: '1.1/direct_messages/events/new.json',
    parameters: {
      event: {
        type: 'message_create',
        message_create: {
          target: { recipient_id: '' },
          message_data: {
            text,
            attachment: media
              ? {
                  type: 'media',
                  media: { id: '' },
                }
              : undefined,
          },
        },
      },
    },
  },
  accomplishRequest: (target: TwitterChat, request, mediaResults) => {
    // eslint-disable-next-line no-param-reassign
    request.parameters.event.message_create.target.recipient_id = target.id;

    if (mediaResults) {
      // eslint-disable-next-line no-param-reassign, prefer-destructuring
      request.parameters.event.message_create.message_data.attachment.media.id =
        mediaResults[0];
    }
    return request;
  },
  mediaSources: media ? [annotateDmMedia(media)] : null,
});

export const createTweetSegmentValue = (
  parameters: Record<string, any>,
  mediaSources?: null | MediaSource[],
  dmLink?:
    | boolean
    | string
    | { recipientId?: string; text?: string; welcomeMessageId?: string }
): TweetSegmentValue => ({
  type: 'tweet',
  request: {
    method: 'POST',
    href: '2/tweets',
    parameters,
  },
  mediaSources: mediaSources ? mediaSources.map(annotateTweetMedia) : null,
  accomplishRequest: (target: TweetTarget, request, mediaIds) => {
    const params = request.parameters;
    return {
      ...request,
      parameters: {
        ...request.parameters,
        reply: target.tweetId
          ? {
              in_reply_to_tweet_id: target.tweetId,
              exclude_reply_user_ids: params.reply?.exclude_reply_user_ids,
            }
          : undefined,
        media: mediaIds
          ? {
              media_ids: mediaIds,
              tagged_user_ids: params.media?.tagged_user_ids,
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
    };
  },
});

let lastTime = 0;
let count = 0;
export const getTimeId = (): string => {
  const now = Date.now();
  if (lastTime === now) {
    count += 1;
  } else {
    lastTime = now;
    count = 0;
  }
  return `${now}-${count}`;
};
