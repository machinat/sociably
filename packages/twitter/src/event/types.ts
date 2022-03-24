import type {
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
  MediaBase,
  PhotoAttachment,
  VideoAttachment,
  AnimatedGifAttachment,
  QuickReply,
  DirectMessageAction,
  DirectMessageTyping,
  DirectMessageMarkRead,
  DeleteTweet,
  Unknown,
} from './mixin';

interface EventObject<Category extends string, Type extends string> {
  category: Category;
  type: Type;
}

/**
 * The subscribing user's tweet is quoted
 * @category Event
 * @eventCategory `'linked_tweet'`
 * @eventType `'reply_tweet'`
 */
export interface ReplyTweetEvent
  extends EventObject<'linked_tweet', 'reply_tweet'>,
    EventBase,
    TweetBase,
    ReplyTweet {}

/**
 * The subscribing user's tweet is quoted
 * @category Event
 * @eventCategory `'linked_tweet'`
 * @eventType `'quote_tweet'`
 */
export interface QuotedTweetEvent
  extends EventObject<'linked_tweet', 'quote_tweet'>,
    EventBase,
    TweetBase,
    QuoteTweet {}

/**
 * The subscribing user's tweet is retweeted
 * @category Event
 * @eventCategory `'linked_tweet'`
 * @eventType `'retweet'`
 */
export interface RetweetEvent
  extends EventObject<'linked_tweet', 'retweet'>,
    EventBase,
    TweetBase,
    Retweet {}

/**
 * The subscribing user is mentioned in a tweet
 * @category Event
 * @eventCategory `'linked_tweet'`
 * @eventType `'mention'`
 */
export interface MentionedTweetEvent
  extends EventObject<'linked_tweet', 'mention'>,
    EventBase,
    TweetBase,
    CreateTweet {}

/**
 * The subscribing user receives a text message
 * @category Event
 * @eventCategory `'message'`
 * @eventType `'text'`
 */
export interface TextMessageEvent
  extends EventObject<'message', 'text'>,
    EventBase,
    DirectMessageCreate {}

/**
 * The subscribing user receives a image message
 * @category Event
 * @eventCategory `'message'`
 * @eventType `'image'`
 */
export interface ImageMessageEvent
  extends EventObject<'message', 'image'>,
    EventBase,
    DirectMessageCreate,
    MediaBase,
    PhotoAttachment {}

/**
 * The subscribing user receives a video message
 * @category Event
 * @eventCategory `'message'`
 * @eventType `'video'`
 */
export interface VideoMessageEvent
  extends EventObject<'message', 'video'>,
    EventBase,
    DirectMessageCreate,
    MediaBase,
    VideoAttachment {}

/**
 * The subscribing user receives am animated gif message
 * @category Event
 * @eventCategory `'message'`
 * @eventType `'animated_gif'`
 */
export interface AnimatedGifMessageEvent
  extends EventObject<'message', 'animated_gif'>,
    EventBase,
    DirectMessageCreate,
    MediaBase,
    AnimatedGifAttachment {}

/**
 * The subscribing user tap a quick reply button
 * @category Event
 * @eventCategory `'message'`
 * @eventType `'quick_reply'`
 */
export interface QuickReplyMessageEvent
  extends EventObject<'message', 'quick_reply'>,
    EventBase,
    DirectMessageCreate,
    QuickReply {}

/**
 * A user likes a tweet of the subscribing user
 * @category Event
 * @eventCategory `'action'`
 * @eventType `'like'`
 */
export interface LikeEvent
  extends EventObject<'action', 'like'>,
    EventBase,
    Favorite {}

/**
 * A user follows the subscribing user
 * @category Event
 * @eventCategory `'action'`
 * @eventType `'follow'`
 */
export interface FollowEvent
  extends EventObject<'action', 'follow'>,
    EventBase,
    UserToUserAction {}

/**
 * A user is typing in the direct message chat
 * @category Event
 * @eventCategory `'action'`
 * @eventType `'typing'`
 */
export interface TypingEvent
  extends EventObject<'action', 'typing'>,
    EventBase,
    DirectMessageAction,
    DirectMessageTyping {}

/**
 * A user is typing in the direct message chat
 * @category Event
 * @eventCategory `'action'`
 * @eventType `'read'`
 */
export interface ReadEvent
  extends EventObject<'action', 'read'>,
    EventBase,
    DirectMessageAction,
    DirectMessageMarkRead {}

/**
 * The subscribing user creates a tweet
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'tweet'`
 */
export interface TweetEchoEvent
  extends EventObject<'echo', 'tweet'>,
    EventBase,
    TweetBase,
    CreateTweet {}

/**
 * The subscribing user deletes a tweet
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'delete_tweet'`
 */
export interface DeleteTweetEchoEvent
  extends EventObject<'echo', 'delete_tweet'>,
    EventBase,
    DeleteTweet {}

/**
 * The subscribing user likes a tweet
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'like'`
 */
export interface LikeEchoEvent
  extends EventObject<'echo', 'like'>,
    EventBase,
    Favorite {}

/**
 * The subscribing user follows a user
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'follow'`
 */
export interface FollowEchoEvent
  extends EventObject<'echo', 'follow'>,
    EventBase,
    UserToUserAction {}

/**
 * The subscribing user unfollows a user
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'unfollow'`
 */
export interface UnfollowEchoEvent
  extends EventObject<'echo', 'unfollow'>,
    EventBase,
    UserToUserAction {}

/**
 * The subscribing user blocks a user
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'block'`
 */
export interface BlockEchoEvent
  extends EventObject<'echo', 'block'>,
    EventBase,
    UserToUserAction {}

/**
 * The subscribing user unblocks a user
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'unblock'`
 */
export interface UnblockEchoEvent
  extends EventObject<'echo', 'unblock'>,
    EventBase,
    UserToUserAction {}

/**
 * The subscribing user mutes a user
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'mute'`
 */
export interface MuteEchoEvent
  extends EventObject<'echo', 'mute'>,
    EventBase,
    UserToUserAction {}

/**
 * The subscribing user unmutes a user
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'unmute'`
 */
export interface UnmuteEchoEvent
  extends EventObject<'echo', 'unmute'>,
    EventBase,
    UserToUserAction {}

/**
 * The subscribing user sent a direct message
 * @category Event
 * @eventCategory `'echo'`
 * @eventType `'message'`
 */
export interface MessageEchoEvent
  extends EventObject<'echo', 'message'>,
    EventBase,
    DirectMessageCreate {}

/**
 * The subscribing user revokes the app subscription
 * @category Event
 * @eventCategory `'system'`
 * @eventType `'subscription_revoke'`
 */
export interface UserRevokeEvent
  extends EventObject<'system', 'subscription_revoke'>,
    EventBase,
    UserRevoke {}

/**
 * Unknown
 * @category Event
 * @eventCategory `'unknown'`
 * @eventType `'unknown'`
 */
export interface UnknownEvent
  extends EventObject<'unknown', 'unknown'>,
    EventBase,
    Unknown {}

export type DirectMessageEvent =
  | TextMessageEvent
  | ImageMessageEvent
  | VideoMessageEvent
  | AnimatedGifMessageEvent
  | TypingEvent
  | ReadEvent
  | QuickReplyMessageEvent
  | MessageEchoEvent;

export type TwitterEvent =
  | DirectMessageEvent
  | ReplyTweetEvent
  | QuotedTweetEvent
  | RetweetEvent
  | MentionedTweetEvent
  | LikeEvent
  | FollowEvent
  | TypingEvent
  | ReadEvent
  | TweetEchoEvent
  | DeleteTweetEchoEvent
  | LikeEchoEvent
  | FollowEchoEvent
  | UnfollowEchoEvent
  | BlockEchoEvent
  | UnblockEchoEvent
  | MuteEchoEvent
  | UnmuteEchoEvent
  | MessageEchoEvent
  | UserRevokeEvent
  | UnknownEvent;
