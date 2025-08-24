import type { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent.js';
import createTweetSegmentValue from '../utils/createTweetSegmentValue.js';
import splitTweetText from '../utils/splitTweetText.js';
import {
  TwitterSegmentValue,
  TwitterComponent,
  MediaAttachment,
} from '../types.js';

/** @category Props */
export type TweetProps = {
  /** Texual content of the tweet */
  children?: SociablyNode;
  /**
   * Tweets a link directly to a Direct Message conversation with an account. By
   * default it links to the agent who create the tweet. You can directly pass
   * the URL string or an object specifying the URL queries.
   */
  directMessageLink?:
    | boolean
    | string
    | {
        text?: string;
        recipientId?: string;
        welcomeMessageId?: string;
      };
  /** Place ID being attached to the Tweet for geo location */
  placeId?: string;
  /**
   * Link to the Tweet being quoted. This is mutually exclusive from `media` and
   * `poll`
   */
  quoteTweetId?: string;
  /**
   * Attach media to the tweet. Should contain only {@link Media}. This is
   * mutually exclusive from `poll` and `quoteTweetId`
   */
  media?: SociablyNode;
  /**
   * A list of User IDs being tagged in the Tweet with Media. If the user you're
   * tagging doesn't have photo-tagging enabled, their names won't show up in
   * the list of tagged users even though the Tweet is successfully created
   */
  tagUsersInMedia?: string[];
  /**
   * Attach a poll to the tweet. This is mutually exclusive from `media` and
   * `quoteTweetId`
   */
  poll?: {
    /** Duration of the poll in minutes for a Tweet with a poll */
    durationMinutes: number;
    /** A list of poll options for a Tweet with a poll */
    options: string[];
  };
  /**
   * A list of User IDs to be excluded from the reply Tweet thus removing a user
   * from a thread
   */
  excludeUsersInReply?: string[];
  /** Tweet exclusively for Super Followers. */
  superFollowersOnly?: boolean;
  /** Indicate who can reply to the Tweet. Default to `'everyone'` */
  replySetting?: 'everyone' | 'following' | 'mentionedUsers';
};

/**
 * Send direct messages with metadata
 *
 * @category Component
 * @props {@link TweetProps}
 * @guides Check official [guides](https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/api-features).
 */
export const Tweet: TwitterComponent<
  TweetProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(async function Tweet(node, path, render) {
  const {
    children,
    directMessageLink,
    placeId,
    media,
    tagUsersInMedia,
    poll,
    quoteTweetId,
    excludeUsersInReply,
    superFollowersOnly,
    replySetting,
  } = node.props;

  if ((media && poll) || (media && quoteTweetId) || (poll && quoteTweetId)) {
    throw new TypeError(
      'there should be exactly one of "media", "poll" or "quoteTweetId" prop',
    );
  }

  const [contentSegments, mediaSegments] = await Promise.all([
    render<TwitterSegmentValue>(children, '.children'),
    render<TwitterSegmentValue>(media, '.media'),
  ]);

  for (const segment of contentSegments || []) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-texual element ${formatNode(
          segment.node,
        )} can't be placed under <Tweet/>`,
      );
    }
  }

  let mediaAttachments: null | MediaAttachment[] = null;
  if (mediaSegments) {
    mediaAttachments = [];

    for (const segment of mediaSegments) {
      if (
        (segment.type !== 'unit' && segment.type !== 'raw') ||
        segment.value.type !== 'media'
      ) {
        throw new TypeError(
          `${formatNode(segment.node)} can't be placed in "media" prop`,
        );
      }

      mediaAttachments.push(segment.value.attachment);
    }
  }

  if (!contentSegments && !mediaAttachments) {
    throw new TypeError(`no text or media in <Tweet/>`);
  }

  const content = contentSegments?.[0].value as string;
  const splitedContent = splitTweetText(content);

  const segments = [
    makeUnitSegment(
      node,
      path,
      createTweetSegmentValue(
        {
          text: splitedContent?.[0],
          reply: excludeUsersInReply
            ? {
                in_reply_to_tweet_id: '',
                exclude_reply_user_ids: excludeUsersInReply,
              }
            : undefined,
          media: tagUsersInMedia
            ? {
                media_ids: [],
                tagged_user_ids: tagUsersInMedia,
              }
            : undefined,
          quote_tweet_id: quoteTweetId,
          poll: poll
            ? {
                options: poll.options,
                duration_minutes: poll.durationMinutes,
              }
            : undefined,
          geo: placeId ? { place_id: placeId } : undefined,
          reply_settings: replySetting,
          for_super_followers_only: superFollowersOnly,
          direct_message_deep_link: undefined,
        },
        mediaAttachments,
        directMessageLink,
      ),
    ),
  ];

  if (splitedContent) {
    segments.push(
      ...splitedContent
        .slice(1)
        .map((text) =>
          makeUnitSegment(node, path, createTweetSegmentValue({ text })),
        ),
    );
  }

  return segments;
});
