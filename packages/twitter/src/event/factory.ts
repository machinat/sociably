import { mixin } from '@machinat/core/utils';
import {
  EventBase,
  TweetBase,
  CreateTweet,
  ReplyTweet,
  QuoteTweet,
  Retweet,
  Favorite,
  UserRevoke,
  UserToUserAction,
  DirectMessageCreate,
  DirectMessageAction,
  DirectMessageTyping,
  DirectMessageMarkRead,
  MediaBase,
  PhotoAttachment,
  VideoAttachment,
  AnimatedGifAttachment,
  QuickReply,
  DeleteTweet,
  Unknown,
} from './mixin';
import { RawTwitterEventBody } from '../types';
import { TwitterEvent } from './types';

const makeEvent = <Proto extends TwitterEvent>(
  forUserId: string,
  userHasBlocked: undefined | boolean,
  payload: Proto['payload'],
  proto: Proto
): Proto => {
  const event: Proto = Object.create(proto);

  event.forUserId = forUserId;
  event.userHasBlocked = userHasBlocked;
  event.payload = payload;

  return event;
};

const TweetProto = mixin(EventBase, TweetBase);

const ReplyTweetProto = mixin(TweetProto, ReplyTweet, {
  category: 'tweet' as const,
  type: 'reply' as const,
});

const QuoteTweetProto = mixin(TweetProto, QuoteTweet, {
  category: 'tweet' as const,
  type: 'quote_tweet' as const,
});

const RetweetProto = mixin(TweetProto, Retweet, {
  category: 'tweet' as const,
  type: 'retweet' as const,
});

const TweetMentionProto = mixin(TweetProto, CreateTweet, {
  category: 'tweet' as const,
  type: 'mention' as const,
});

const EchoTweetProto = mixin(TweetProto, CreateTweet, {
  category: 'echo' as const,
  type: 'tweet' as const,
});

const EchoDeleteTweetProto = mixin(EventBase, DeleteTweet, {
  category: 'echo' as const,
  type: 'delete_tweet' as const,
});

const LikeProto = mixin(EventBase, Favorite);

const ActionLikeProto = mixin(LikeProto, {
  category: 'action' as const,
  type: 'like' as const,
});

const EchoLikeProto = mixin(LikeProto, {
  category: 'echo' as const,
  type: 'like' as const,
});

const UserToUserActionProto = mixin(EventBase, UserToUserAction);

const ActionFollowProto = mixin(UserToUserActionProto, {
  category: 'action' as const,
  type: 'follow' as const,
});

const EchoFollowProto = mixin(UserToUserActionProto, {
  category: 'echo' as const,
  type: 'follow' as const,
});

const EchoUnfollowProto = mixin(UserToUserActionProto, {
  category: 'echo' as const,
  type: 'unfollow' as const,
});

const EchoBlockProto = mixin(UserToUserActionProto, {
  category: 'echo' as const,
  type: 'block' as const,
});

const EchoUnblockProto = mixin(UserToUserActionProto, {
  category: 'echo' as const,
  type: 'unblock' as const,
});

const EchoMuteProto = mixin(UserToUserActionProto, {
  category: 'echo' as const,
  type: 'mute' as const,
});

const EchoUnmuteProto = mixin(UserToUserActionProto, {
  category: 'echo' as const,
  type: 'unmute' as const,
});

const DirectMessageProto = mixin(EventBase, DirectMessageCreate);

const TextMessageProto = mixin(DirectMessageProto, {
  category: 'message' as const,
  type: 'text' as const,
});

const MediaProto = mixin(DirectMessageProto, MediaBase);

const ImageMessageProto = mixin(MediaProto, PhotoAttachment, {
  category: 'message' as const,
  type: 'image' as const,
});

const VideoMessageProto = mixin(MediaProto, VideoAttachment, {
  category: 'message' as const,
  type: 'video' as const,
});

const GifMessageProto = mixin(MediaProto, AnimatedGifAttachment, {
  category: 'message' as const,
  type: 'animated_gif' as const,
});

const QuickReplyProto = mixin(DirectMessageProto, QuickReply, {
  category: 'postback' as const,
  type: 'quick_reply' as const,
});

const EchoMessageProto = mixin(DirectMessageProto, {
  category: 'echo' as const,
  type: 'message' as const,
});

const ActionTypingProto = mixin(
  EventBase,
  DirectMessageAction,
  DirectMessageTyping,
  {
    category: 'action' as const,
    type: 'typing' as const,
  }
);

const ActionReadProto = mixin(
  EventBase,
  DirectMessageAction,
  DirectMessageMarkRead,
  {
    category: 'action' as const,
    type: 'read' as const,
  }
);

const SubscriptionRevokeProto = mixin(EventBase, UserRevoke, {
  category: 'system' as const,
  type: 'subscription_revoke' as const,
});

const UnknownProto = mixin(EventBase, Unknown, {
  category: 'unknown' as const,
  type: 'unknown' as const,
});

const eventFactory = (body: RawTwitterEventBody): TwitterEvent[] => {
  if ('tweet_create_events' in body) {
    const { for_user_id: forUserId, user_has_blocked: userHasBlockedStr } =
      body;
    const userHasBlocked = userHasBlockedStr && Boolean(userHasBlockedStr);

    return body.tweet_create_events.map((rawTweet) => {
      if (rawTweet.user.id_str === forUserId) {
        return makeEvent(forUserId, userHasBlocked, rawTweet, EchoTweetProto);
      }
      if (
        rawTweet.in_reply_to_status_id &&
        rawTweet.in_reply_to_user_id_str === forUserId
      ) {
        return makeEvent(forUserId, userHasBlocked, rawTweet, ReplyTweetProto);
      }
      if (rawTweet.retweeted_status?.user.id_str === forUserId) {
        return makeEvent(forUserId, userHasBlocked, rawTweet, RetweetProto);
      }
      if (rawTweet.quoted_status?.user.id_str === forUserId) {
        return makeEvent(forUserId, userHasBlocked, rawTweet, QuoteTweetProto);
      }
      return makeEvent(forUserId, userHasBlocked, rawTweet, TweetMentionProto);
    });
  }

  if ('favorite_events' in body) {
    const { for_user_id: forUserId } = body;
    return body.favorite_events.map((rawFavorite) => {
      if (rawFavorite.user.id_str === forUserId) {
        return makeEvent(forUserId, undefined, rawFavorite, ActionLikeProto);
      }
      return makeEvent(forUserId, undefined, rawFavorite, EchoLikeProto);
    });
  }

  if ('follow_events' in body) {
    const { for_user_id: forUserId } = body;
    return body.follow_events.map((rawFollow) => {
      if (rawFollow.type === 'unfollow') {
        return makeEvent(forUserId, undefined, rawFollow, EchoUnfollowProto);
      }
      if (rawFollow.source.id_str === forUserId) {
        return makeEvent(forUserId, undefined, rawFollow, EchoFollowProto);
      }
      return makeEvent(forUserId, undefined, rawFollow, ActionFollowProto);
    });
  }

  if ('block_events' in body) {
    const { for_user_id: forUserId } = body;
    return body.block_events.map((rawBlock) => {
      if (rawBlock.type === 'unblock') {
        return makeEvent(forUserId, undefined, rawBlock, EchoUnblockProto);
      }
      return makeEvent(forUserId, undefined, rawBlock, EchoBlockProto);
    });
  }

  if ('mute_events' in body) {
    const { for_user_id: forUserId } = body;
    return body.mute_events.map((rawBlock) => {
      if (rawBlock.type === 'unmute') {
        return makeEvent(forUserId, undefined, rawBlock, EchoUnmuteProto);
      }
      return makeEvent(forUserId, undefined, rawBlock, EchoMuteProto);
    });
  }

  if ('user_event' in body) {
    return [makeEvent('', undefined, body, SubscriptionRevokeProto)];
  }

  if ('direct_message_events' in body) {
    const { for_user_id: forUserId, apps, users } = body;

    return body.direct_message_events.map((rawMessage) => {
      const messageContent = rawMessage.message_create.message_data;
      const event =
        rawMessage.message_create.sender_id === forUserId
          ? makeEvent(forUserId, undefined, rawMessage, EchoMessageProto)
          : messageContent.attachment
          ? messageContent.attachment.type === 'media'
            ? messageContent.attachment.media.type === 'photo'
              ? makeEvent(forUserId, undefined, rawMessage, ImageMessageProto)
              : messageContent.attachment.media.type === 'video'
              ? makeEvent(forUserId, undefined, rawMessage, VideoMessageProto)
              : messageContent.attachment.media.type === 'animated_gif'
              ? makeEvent(forUserId, undefined, rawMessage, GifMessageProto)
              : makeEvent(forUserId, undefined, rawMessage, TextMessageProto)
            : makeEvent(forUserId, undefined, rawMessage, TextMessageProto)
          : messageContent.quick_reply_response
          ? makeEvent(forUserId, undefined, rawMessage, QuickReplyProto)
          : makeEvent(forUserId, undefined, rawMessage, TextMessageProto);
      event.usersMapping = users;
      event.appsMapping = apps;
      return event;
    });
  }

  if ('direct_message_indicate_typing_events' in body) {
    const { for_user_id: forUserId, users } = body;

    return body.direct_message_indicate_typing_events.map((rawMessage) => {
      const event = makeEvent(
        forUserId,
        undefined,
        rawMessage,
        ActionTypingProto
      );
      event.usersMapping = users;
      return event;
    });
  }

  if ('direct_message_mark_read_events' in body) {
    const { for_user_id: forUserId, users } = body;

    return body.direct_message_mark_read_events.map((rawRead) => {
      const event = makeEvent(forUserId, undefined, rawRead, ActionReadProto);
      event.usersMapping = users;
      return event;
    });
  }

  if ('tweet_delete_events' in body) {
    return body.tweet_delete_events.map((rawMessage) => {
      return makeEvent(
        body.for_user_id,
        undefined,
        rawMessage,
        EchoDeleteTweetProto
      );
    });
  }

  const { for_user_id: forUserId } = body;
  return [makeEvent(forUserId, undefined, body, UnknownProto)];
};

export default eventFactory;
