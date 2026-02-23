import {
  ReplyTweetEvent,
  QuotedTweetEvent,
  RetweetEvent,
  MentionedTweetEvent,
  EchoTweetEvent,
  TextMessageEvent,
  ImageMessageEvent,
  VideoMessageEvent,
  AnimatedGifMessageEvent,
  QuickReplyEvent,
  EchoMessageEvent,
  LikeEvent,
  EchoLikeEvent,
  FollowEvent,
  EchoFollowEvent,
  EchoUnfollowEvent,
  EchoBlockEvent,
  EchoUnblockEvent,
  EchoMuteEvent,
  EchoUnmuteEvent,
  EchoDirectMessageTypingEvent,
  DirectMessageTypingEvent,
  EchoDirectMessageMarkReadEvent,
  DirectMessageMarkReadEvent,
  EchoDeleteTweetEvent,
  UserRevokeEvent,
  UnknownEvent,
  TwitterEvent,
} from './events.js';
import type { RawTwitterEventBody } from '../types.js';

const eventFactory = (body: RawTwitterEventBody): TwitterEvent[] => {
  if ('tweet_create_events' in body) {
    const { for_user_id: forUserId, user_has_blocked: userHasBlockedStr } =
      body;
    const userHasBlocked = userHasBlockedStr && Boolean(userHasBlockedStr);

    return body.tweet_create_events.map((rawTweet) => {
      if (rawTweet.user.id_str === forUserId) {
        return new EchoTweetEvent(forUserId, rawTweet, userHasBlocked);
      }
      if (
        rawTweet.in_reply_to_status_id &&
        rawTweet.in_reply_to_user_id_str === forUserId
      ) {
        return new ReplyTweetEvent(forUserId, rawTweet, userHasBlocked);
      }
      if (rawTweet.retweeted_status?.user.id_str === forUserId) {
        return new RetweetEvent(forUserId, rawTweet, userHasBlocked);
      }
      if (rawTweet.quoted_status?.user.id_str === forUserId) {
        return new QuotedTweetEvent(forUserId, rawTweet, userHasBlocked);
      }
      return new MentionedTweetEvent(forUserId, rawTweet, userHasBlocked);
    });
  }

  if ('favorite_events' in body) {
    const { for_user_id: forUserId } = body;
    return body.favorite_events.map((rawFavorite) => {
      if (rawFavorite.user.id_str === forUserId) {
        return new EchoLikeEvent(forUserId, rawFavorite);
      }
      return new LikeEvent(forUserId, rawFavorite);
    });
  }

  if ('follow_events' in body) {
    const { for_user_id: forUserId } = body;
    return body.follow_events.map((rawFollow) => {
      if (rawFollow.type === 'unfollow') {
        return new EchoUnfollowEvent(forUserId, rawFollow);
      }
      if (rawFollow.source.id_str === forUserId) {
        return new EchoFollowEvent(forUserId, rawFollow);
      }
      return new FollowEvent(forUserId, rawFollow);
    });
  }

  if ('block_events' in body) {
    const { for_user_id: forUserId } = body;
    return body.block_events.map((rawBlock) => {
      if (rawBlock.type === 'unblock') {
        return new EchoUnblockEvent(forUserId, rawBlock);
      }
      return new EchoBlockEvent(forUserId, rawBlock);
    });
  }

  if ('mute_events' in body) {
    const { for_user_id: forUserId } = body;
    return body.mute_events.map((rawMute) => {
      if (rawMute.type === 'unmute') {
        return new EchoUnmuteEvent(forUserId, rawMute);
      }
      return new EchoMuteEvent(forUserId, rawMute);
    });
  }

  if ('user_event' in body) {
    return [new UserRevokeEvent('', body)];
  }

  if ('direct_message_events' in body) {
    const { for_user_id: forUserId, apps, users } = body;

    return body.direct_message_events.map((rawMessage) => {
      const messageContent = rawMessage.message_create.message_data;
      let event: TwitterEvent;

      if (rawMessage.message_create.sender_id === forUserId) {
        event = new EchoMessageEvent(forUserId, rawMessage);
      } else if (messageContent.attachment) {
        if (messageContent.attachment.type === 'media') {
          if (messageContent.attachment.media.type === 'photo') {
            event = new ImageMessageEvent(forUserId, rawMessage);
          } else if (messageContent.attachment.media.type === 'video') {
            event = new VideoMessageEvent(forUserId, rawMessage);
          } else if (messageContent.attachment.media.type === 'animated_gif') {
            event = new AnimatedGifMessageEvent(forUserId, rawMessage);
          } else {
            event = new TextMessageEvent(forUserId, rawMessage);
          }
        } else {
          event = new TextMessageEvent(forUserId, rawMessage);
        }
      } else if (messageContent.quick_reply_response) {
        event = new QuickReplyEvent(forUserId, rawMessage);
      } else {
        event = new TextMessageEvent(forUserId, rawMessage);
      }

      if ('usersMapping' in event) {
        event.usersMapping = users;
      }
      if ('appsMapping' in event) {
        event.appsMapping = apps;
      }
      return event;
    });
  }

  if ('direct_message_indicate_typing_events' in body) {
    const { for_user_id: forUserId, users } = body;

    return body.direct_message_indicate_typing_events.map((rawMessage) => {
      const event =
        rawMessage.sender_id === forUserId
          ? new EchoDirectMessageTypingEvent(forUserId, rawMessage)
          : new DirectMessageTypingEvent(forUserId, rawMessage);

      if ('usersMapping' in event) {
        event.usersMapping = users;
      }
      return event;
    });
  }

  if ('direct_message_mark_read_events' in body) {
    const { for_user_id: forUserId, users } = body;

    return body.direct_message_mark_read_events.map((rawRead) => {
      const event =
        rawRead.sender_id === forUserId
          ? new EchoDirectMessageMarkReadEvent(forUserId, rawRead)
          : new DirectMessageMarkReadEvent(forUserId, rawRead);

      if ('usersMapping' in event) {
        event.usersMapping = users;
      }
      return event;
    });
  }

  if ('tweet_delete_events' in body) {
    return body.tweet_delete_events.map(
      (rawMessage) => new EchoDeleteTweetEvent(body.for_user_id, rawMessage),
    );
  }

  const { for_user_id: forUserId } = body;
  return [new UnknownEvent(forUserId, body)];
};

export default eventFactory;
