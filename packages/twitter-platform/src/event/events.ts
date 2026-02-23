/* eslint-disable @typescript-eslint/no-empty-interface */
import TwitterUser from '../User.js';
import Tweet from '../Tweet.js';
import TweetTarget from '../TweetTarget.js';
import DirectMessageChat from '../Chat.js';
import { TWITTER } from '../constant.js';
import polishUrlEntity from '../utils/polishUrlEntity.js';
import polishMentionEntity from '../utils/polishMentionEntity.js';
import polishMedia from '../utils/polishMedia.js';
import type {
  RawFavorite,
  RawTweet,
  RawActionInfo,
  RawUserRevokeEvent,
  RawTweetDelete,
  RawDirectMessage,
  RawDirectMessageAction,
  RawDirectMessageMarkRead,
  RawUser,
  RawApp,
  HashtagEntity,
  SymbolEntity,
  UrlEntity,
  MentionEntity,
  Media as MediaObject,
  Photo,
  Video,
  AnimatedGif,
} from '../types.js';

class EventBase<Payload> {
  readonly platform = TWITTER;

  constructor(
    public forUserId: string,
    public payload: Payload,
    public userHasBlocked?: boolean,
  ) {}

  get agent(): TwitterUser {
    return new TwitterUser(this.forUserId);
  }

  readonly [Symbol.toStringTag] = 'TwitterEvent';
}

class TweetMessage extends EventBase<RawTweet> {
  /** Tweet payload */
  get tweetData(): RawTweet {
    return this.payload;
  }

  /** The user who posted this Tweet */
  get user(): TwitterUser {
    return new TwitterUser(this.tweetData.user.id_str, this.tweetData.user);
  }

  /** The thread object to interact with the tweet */
  get thread(): TweetTarget {
    return new TweetTarget(this.forUserId, this.tweetData.id_str);
  }

  /** Represent if the subscribing user is mentioned in the tweet */
  get isMentioned(): boolean {
    return typeof this.userHasBlocked === 'boolean';
  }

  /** Represent if the tweet is created by the subscribing user */
  get isEcho(): boolean {
    return this.forUserId === this.tweetData.user.id_str;
  }

  /** Tweet object */
  get tweet(): Tweet {
    return new Tweet(this.tweetData);
  }
}

class DirectMessage extends EventBase<RawDirectMessage> {
  /** Direct message payload */
  get messageData(): RawDirectMessage {
    return this.payload;
  }

  /** Represent if the message is sent by the subscribing user */
  get isEcho(): boolean {
    return this.messageData.message_create.sender_id === this.forUserId;
  }

  /** The thread object to reply messages back */
  get thread(): DirectMessageChat {
    const rawMessage = this.messageData.message_create;
    return new DirectMessageChat(
      this.forUserId,
      this.isEcho ? rawMessage.target.recipient_id : rawMessage.sender_id,
    );
  }

  /** The user who sent the message */
  get user(): TwitterUser {
    const senderId = this.messageData.message_create.sender_id;
    return new TwitterUser(senderId, this.usersMapping?.[senderId]);
  }

  /** The user who receive the message */
  get recipient(): TwitterUser {
    const recipientId = this.messageData.message_create.target.recipient_id;
    return new TwitterUser(recipientId, this.usersMapping?.[recipientId]);
  }

  /** The message time */
  get time(): Date {
    return new Date(this.messageData.created_timestamp);
  }

  /** The message text */
  get text(): string {
    return this.messageData.message_create.message_data.text;
  }

  /** The message id */
  get id(): string {
    return this.messageData.id;
  }

  get initiatedViaTweet(): string | undefined {
    return this.messageData.message_create.initiated_via?.tweet_id;
  }

  get initiatedViaWelcomeMessage(): string | undefined {
    return this.messageData.message_create.initiated_via?.welcome_message_id;
  }

  get sourceApp(): RawApp | undefined {
    return this.appsMapping?.[this.messageData.message_create.source_app_id];
  }

  /** The hashtags in the message text */
  get hashtags(): HashtagEntity[] {
    return this.messageData.message_create.message_data.entities.hashtags;
  }

  /** The symbols in the message text */
  get symbols(): SymbolEntity[] {
    return this.messageData.message_create.message_data.entities.symbols;
  }

  /** The urls in the message text */
  get urls(): UrlEntity[] {
    return this.messageData.message_create.message_data.entities.urls.map(
      polishUrlEntity,
    );
  }

  /** The mentions in the message text */
  get userMentions(): MentionEntity[] {
    return this.messageData.message_create.message_data.entities.user_mentions.map(
      polishMentionEntity,
    );
  }

  /** The media object */
  get media(): MediaObject | null {
    const { attachment } = this.messageData.message_create.message_data;
    return attachment?.type === 'media' ? polishMedia(attachment.media) : null;
  }

  usersMapping?: Record<string, RawUser>;
  appsMapping?: Record<string, RawApp>;
}

class ActionMessage extends EventBase<RawActionInfo> {
  /** Action payload */
  get actionData(): RawActionInfo {
    return this.payload;
  }

  get thread(): DirectMessageChat {
    return new DirectMessageChat(
      this.forUserId,
      this.isEcho
        ? this.actionData.target.id_str
        : this.actionData.source.id_str,
    );
  }

  /** The user who trigger the action */
  get user(): TwitterUser {
    return new TwitterUser(
      this.actionData.source.id_str,
      this.actionData.source,
    );
  }

  /** The target user */
  get target(): TwitterUser {
    return new TwitterUser(
      this.actionData.target.id_str,
      this.actionData.target,
    );
  }

  /** The time when the action is triggered */
  get time(): Date {
    return new Date(this.actionData.created_timestamp);
  }

  /** Represent if the action is initiated by the subscribing user */
  get isEcho(): boolean {
    return this.actionData.source.id_str === this.forUserId;
  }
}

class FavoriteMessage extends EventBase<RawFavorite> {
  /** Favorite payload */
  get favoriteData(): RawFavorite {
    return this.payload;
  }

  /** The user who tap favorite */
  get user(): TwitterUser {
    return new TwitterUser(
      this.favoriteData.user.id_str,
      this.favoriteData.user,
    );
  }

  /** The thread object to interact with the tweet */
  get thread(): TweetTarget {
    return new TweetTarget(
      this.forUserId,
      this.favoriteData.favorited_status.id_str,
    );
  }

  /** The Tweet being favorite */
  get tweet(): Tweet {
    return new Tweet(this.favoriteData.favorited_status);
  }

  /** Like id */
  get id(): string {
    return this.favoriteData.id;
  }

  /** Like time */
  get time(): Date {
    return new Date(this.favoriteData.timestamp_ms);
  }

  /** Represent if the action is initiated by the subscribing user */
  get isEcho(): boolean {
    return this.favoriteData.user.id_str === this.forUserId;
  }
}

class DirectMessageActionBase extends EventBase<RawDirectMessageAction> {
  /** Action payload */
  get actionData(): RawDirectMessageAction {
    return this.payload;
  }

  get thread(): DirectMessageChat {
    return new DirectMessageChat(this.forUserId, this.actionData.sender_id);
  }

  get user(): TwitterUser {
    const senderId = this.actionData.sender_id;
    return new TwitterUser(senderId, this.usersMapping?.[senderId]);
  }

  get recipient(): TwitterUser {
    const recipientId = this.actionData.target.recipient_id;
    return new TwitterUser(recipientId, this.usersMapping?.[recipientId]);
  }

  get time(): Date {
    return new Date(this.actionData.created_timestamp);
  }

  usersMapping?: Record<string, RawUser>;
}

// Tweet Events
export class ReplyTweetEvent extends TweetMessage {
  readonly kind = 'tweet';
  readonly type = 'reply';

  /** Tweet object */
  get tweet(): Tweet & { replyTo: Exclude<Tweet['replyTo'], null> } {
    return new Tweet(this.tweetData) as Tweet & {
      replyTo: Exclude<Tweet['replyTo'], null>;
    };
  }
}

export class QuotedTweetEvent extends TweetMessage {
  readonly kind = 'tweet';
  readonly type = 'quote_tweet';

  /** Tweet object */
  get tweet(): Tweet & { quotedStatus: Tweet } {
    return new Tweet(this.tweetData) as Tweet & { quotedStatus: Tweet };
  }
}

export class RetweetEvent extends TweetMessage {
  readonly kind = 'tweet';
  readonly type = 'retweet';

  /** Tweet object */
  get tweet(): Tweet & { retweetedStatus: Tweet } {
    return new Tweet(this.tweetData) as Tweet & { retweetedStatus: Tweet };
  }
}

export class MentionedTweetEvent extends TweetMessage {
  readonly kind = 'tweet';
  readonly type = 'mention';
}

export class EchoTweetEvent extends TweetMessage {
  readonly kind = 'echo';
  readonly type = 'tweet';
}

// Direct Message Events
export class TextMessageEvent extends DirectMessage {
  readonly kind = 'message';
  readonly type = 'text';
}

export class ImageMessageEvent extends DirectMessage {
  readonly kind = 'message';
  readonly type = 'image';

  /** The photo media object */
  get photo(): Photo {
    return this.media as unknown as Photo;
  }

  /** The url to download media */
  get url(): string {
    return (
      this.messageData.message_create.message_data.attachment?.media
        ?.media_url_https || ''
    );
  }
}

export class VideoMessageEvent extends DirectMessage {
  readonly kind = 'message';
  readonly type = 'video';

  /** The video media object */
  get video(): Video {
    return this.media as unknown as Video;
  }

  /** The url to download media */
  get url(): string {
    return (
      this.messageData.message_create.message_data.attachment?.media
        ?.media_url_https || ''
    );
  }
}

export class AnimatedGifMessageEvent extends DirectMessage {
  readonly kind = 'message';
  readonly type = 'animated_gif';

  /** The animated gif media object */
  get animatedGif(): AnimatedGif {
    return this.media as unknown as AnimatedGif;
  }

  /** The url to download media */
  get url(): string {
    return (
      this.messageData.message_create.message_data.attachment?.media
        ?.media_url_https || ''
    );
  }
}

export class QuickReplyEvent extends DirectMessage {
  readonly kind = 'callback';
  readonly type = 'quick_reply';

  /** The callback metadata set on the quick reply */
  get callbackData(): string {
    return (
      this.messageData.message_create.message_data.quick_reply_response
        ?.metadata || ''
    );
  }
}

export class EchoMessageEvent extends DirectMessage {
  readonly kind = 'echo';
  readonly type = 'message';
}

// Action Events
export class LikeEvent extends FavoriteMessage {
  readonly kind = 'action';
  readonly type = 'like';
}

export class EchoLikeEvent extends FavoriteMessage {
  readonly kind = 'echo';
  readonly type = 'like';
}

export class FollowEvent extends ActionMessage {
  readonly kind = 'action';
  readonly type = 'follow';
}

export class EchoFollowEvent extends ActionMessage {
  readonly kind = 'echo';
  readonly type = 'follow';
}

export class EchoUnfollowEvent extends ActionMessage {
  readonly kind = 'echo';
  readonly type = 'unfollow';
}

export class EchoBlockEvent extends ActionMessage {
  readonly kind = 'echo';
  readonly type = 'block';
}

export class EchoUnblockEvent extends ActionMessage {
  readonly kind = 'echo';
  readonly type = 'unblock';
}

export class EchoMuteEvent extends ActionMessage {
  readonly kind = 'echo';
  readonly type = 'mute';
}

export class EchoUnmuteEvent extends ActionMessage {
  readonly kind = 'echo';
  readonly type = 'unmute';
}

// Direct Message Action Events
export class EchoDirectMessageTypingEvent extends DirectMessageActionBase {
  readonly kind = 'echo';
  readonly type = 'dm_typing';
}

export class DirectMessageTypingEvent extends DirectMessageActionBase {
  readonly kind = 'action';
  readonly type = 'dm_typing';
}

// Direct Message Mark Read Events
export class EchoDirectMessageMarkReadEvent extends EventBase<RawDirectMessageMarkRead> {
  readonly kind = 'echo';
  readonly type = 'dm_mark_read';
  readonly thread = null;
  readonly user = null;

  get markReadData(): RawDirectMessageMarkRead {
    return this.payload;
  }

  get lastReadEventId(): string {
    return this.markReadData.last_read_event_id;
  }
}

export class DirectMessageMarkReadEvent extends EventBase<RawDirectMessageMarkRead> {
  readonly kind = 'action';
  readonly type = 'dm_mark_read';
  readonly thread = null;
  readonly user = null;

  get markReadData(): RawDirectMessageMarkRead {
    return this.payload;
  }

  get lastReadEventId(): string {
    return this.markReadData.last_read_event_id;
  }
}

// Delete Tweet Events
export class EchoDeleteTweetEvent extends EventBase<RawTweetDelete> {
  readonly kind = 'echo';
  readonly type = 'delete_tweet';
  readonly thread = null;

  get deleteData(): RawTweetDelete {
    return this.payload;
  }

  get user(): TwitterUser {
    return new TwitterUser(this.deleteData.status.user_id);
  }

  get statusId(): string {
    return this.deleteData.status.id;
  }

  get time(): Date {
    return new Date(this.deleteData.timestamp_ms);
  }
}

// User Revoke Events
export class UserRevokeEvent extends EventBase<RawUserRevokeEvent> {
  readonly kind = 'system';
  readonly type = 'user_revoke';
  readonly thread = null;

  get revokeData(): RawUserRevokeEvent {
    return this.payload;
  }

  get user(): TwitterUser {
    return new TwitterUser(this.revokeData.user_event.revoke.source.user_id);
  }

  get appId(): string {
    return this.revokeData.user_event.revoke.target.app_id;
  }

  get time(): Date {
    return new Date(this.revokeData.user_event.revoke.date_time);
  }
}

// Unknown Events
export class UnknownEvent extends EventBase<unknown> {
  readonly kind = 'message';
  readonly type = 'unknown';
  readonly thread = null;
  readonly user = null;
}

export type TweetEvent =
  | ReplyTweetEvent
  | QuotedTweetEvent
  | RetweetEvent
  | MentionedTweetEvent
  | EchoTweetEvent;

export type MessageEvent =
  | TextMessageEvent
  | ImageMessageEvent
  | VideoMessageEvent
  | AnimatedGifMessageEvent
  | QuickReplyEvent
  | EchoMessageEvent;

export type ActionEvent =
  | LikeEvent
  | EchoLikeEvent
  | FollowEvent
  | EchoFollowEvent
  | EchoUnfollowEvent
  | EchoBlockEvent
  | EchoUnblockEvent
  | EchoMuteEvent
  | EchoUnmuteEvent
  | EchoDirectMessageTypingEvent
  | DirectMessageTypingEvent
  | EchoDirectMessageMarkReadEvent
  | DirectMessageMarkReadEvent;

export type TwitterEvent =
  | TweetEvent
  | MessageEvent
  | ActionEvent
  | EchoDeleteTweetEvent
  | UserRevokeEvent
  | UnknownEvent;
