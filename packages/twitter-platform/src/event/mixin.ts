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
  Media,
  Photo,
  Video,
  AnimatedGif,
} from '../types.js';

export interface EventBase {
  platform: typeof TWITTER;
  forUserId: string;
  userHasBlocked?: boolean;
  channel: TwitterUser;
  [Symbol.toStringTag]: string;
}

export const EventBase: EventBase = {
  platform: TWITTER,
  forUserId: '',
  userHasBlocked: undefined,
  get channel() {
    return new TwitterUser(this.forUserId);
  },
  [Symbol.toStringTag]: 'TwitterEvent',
};

export interface TweetBase {
  payload: RawTweet;
  /** The user who posted this Tweet */
  user: TwitterUser;
  /** The thread object to interact with the tweet */
  thread: TweetTarget;
  /** Represent if the subscribing user is metioned in the tweet */
  isMentioned: boolean;
  /** Represent if the tweet is created by the subscribing user */
  isEcho: boolean;
}

export const TweetBase: TweetBase = {
  payload: null as never,
  get isMentioned() {
    return typeof (this as EventBase).userHasBlocked === 'boolean';
  },
  get isEcho() {
    return (
      (this as EventBase).forUserId === (this.payload as RawTweet).user.id_str
    );
  },
  get user() {
    const rawUser = (this.payload as RawTweet).user;
    return new TwitterUser(rawUser.id_str, rawUser);
  },
  get thread() {
    return new TweetTarget(
      (this as EventBase).forUserId,
      (this.payload as RawTweet).id_str,
    );
  },
};

export interface CreateTweet {
  /** Tweet object */
  tweet: Tweet;
}

export const CreateTweet: CreateTweet = {
  get tweet() {
    return new Tweet(this.payload as RawTweet);
  },
};

export interface QuoteTweet {
  /** Tweet object */
  tweet: Tweet & { quotedStatus: Tweet };
}
export const QuoteTweet = CreateTweet as QuoteTweet;

export interface Retweet {
  /** Tweet object */
  tweet: Tweet & { retweetedStatus: Tweet };
}
export const Retweet = CreateTweet as Retweet;

export interface ReplyTweet {
  /** Tweet object */
  tweet: Tweet & { replyTo: Exclude<Tweet['replyTo'], null> };
}
export const ReplyTweet = CreateTweet as ReplyTweet;

export interface Favorite {
  payload: RawFavorite;
  /** The user who tap favorite */
  user: TwitterUser;
  /** The thread object to interact with the tweet */
  thread: TweetTarget;
  /** The Tweet being favorite */
  tweet: Tweet;
  /** Like id */
  id: string;
  /** Like time */
  time: Date;
  /** Represent if the action is initiated by the subscribing user */
  isEcho: boolean;
}

export const Favorite: Favorite = {
  payload: null as never,
  get id() {
    return (this.payload as RawFavorite).id;
  },
  get time() {
    return new Date((this.payload as RawFavorite).timestamp_ms);
  },
  get user() {
    const rawUser = (this.payload as RawFavorite).user;
    return new TwitterUser(rawUser.id_str, rawUser);
  },
  get thread() {
    return new TweetTarget(
      (this as EventBase).forUserId,
      (this.payload as RawFavorite).favorited_status.id_str,
    );
  },
  get tweet() {
    return new Tweet((this.payload as RawFavorite).favorited_status);
  },
  get isEcho() {
    return (
      (this.payload as RawFavorite).user.id_str ===
      (this as EventBase).forUserId
    );
  },
};

export interface UserToUserAction {
  payload: RawActionInfo;
  thread: DirectMessageChat;
  /** The user who trigger the action */
  user: TwitterUser;
  /** The target user */
  target: TwitterUser;
  /** The time when the action is triggered */
  time: Date;
  /** Represent if the action is initiated by the subscribing user */
  isEcho: boolean;
}

export const UserToUserAction: UserToUserAction = {
  payload: null as never,
  get isEcho() {
    return (
      (this.payload as RawActionInfo).source.id_str ===
      (this as EventBase).forUserId
    );
  },
  get thread() {
    const action = this.payload as RawActionInfo;
    return new DirectMessageChat(
      (this as EventBase).forUserId,
      (this as UserToUserAction).isEcho
        ? action.target.id_str
        : action.source.id_str,
    );
  },
  get time() {
    return new Date((this.payload as RawActionInfo).created_timestamp);
  },
  get user() {
    const rawUser = (this.payload as RawActionInfo).source;
    return new TwitterUser(rawUser.id_str, rawUser);
  },
  get target() {
    const rawUser = (this.payload as RawActionInfo).target;
    return new TwitterUser(rawUser.id_str, rawUser);
  },
};

export interface UserRevoke {
  payload: RawUserRevokeEvent;
  thread: null;
  user: TwitterUser;
  appId: string;
  time: Date;
}

export const UserRevoke: UserRevoke = {
  payload: null as never,
  thread: null,
  get user() {
    return new TwitterUser(
      (this.payload as RawUserRevokeEvent).user_event.revoke.source.user_id,
    );
  },
  get appId() {
    return (this.payload as RawUserRevokeEvent).user_event.revoke.target.app_id;
  },
  get time() {
    return new Date(
      (this.payload as RawUserRevokeEvent).user_event.revoke.date_time,
    );
  },
};

export interface DirectMessageCreate {
  payload: RawDirectMessage;
  /** Represent if the message is sent by the subscribing user */
  isEcho: boolean;
  /** The thread object to reply messages back */
  thread: DirectMessageChat;
  /** The user who sent the message */
  user: TwitterUser;
  /** The user who receive the message */
  recipient: TwitterUser;
  /** The message time */
  time: Date;
  /** The message text */
  text: string;
  /** The message id */
  id: string;
  initiatedViaTweet?: string;
  initiatedViaWelcomeMessage?: string;
  sourceApp: RawApp;
  /** The hashtags in the message text */
  hashtags: HashtagEntity[];
  /** The symbols in the message text */
  symbols: SymbolEntity[];
  /** The urls in the message text */
  urls: UrlEntity[];
  /** The mentions in the message text */
  userMentions: MentionEntity[];
  /** The media object */
  media: null | Media;
  usersMapping: Record<string, RawUser>;
  appsMapping: Record<string, RawApp>;
}

export const DirectMessageCreate: DirectMessageCreate = {
  payload: null as never,
  usersMapping: null as never,
  appsMapping: null as never,
  get isEcho() {
    return (
      (this.payload as RawDirectMessage).message_create.sender_id ===
      (this as EventBase).forUserId
    );
  },
  get thread() {
    const rawMessage = (this.payload as RawDirectMessage).message_create;
    return new DirectMessageChat(
      (this as EventBase).forUserId,
      (this as DirectMessageCreate).isEcho
        ? rawMessage.target.recipient_id
        : rawMessage.sender_id,
    );
  },
  get user() {
    const senderId = (this.payload as RawDirectMessage).message_create
      .sender_id;
    return new TwitterUser(
      senderId,
      (this as DirectMessageCreate).usersMapping[senderId],
    );
  },
  get recipient() {
    const recipientId = (this.payload as RawDirectMessage).message_create.target
      .recipient_id;
    return new TwitterUser(
      recipientId,
      (this as DirectMessageCreate).usersMapping[recipientId],
    );
  },
  get time() {
    return new Date((this.payload as RawDirectMessage).created_timestamp);
  },
  get text() {
    return (this.payload as RawDirectMessage).message_create.message_data.text;
  },
  get id() {
    return (this.payload as RawDirectMessage).id;
  },
  get initiatedViaTweet() {
    return (this.payload as RawDirectMessage).message_create.initiated_via
      ?.tweet_id;
  },
  get initiatedViaWelcomeMessage() {
    return (this.payload as RawDirectMessage).message_create.initiated_via
      ?.welcome_message_id;
  },
  get sourceApp() {
    return (this as DirectMessageCreate).appsMapping[
      (this.payload as RawDirectMessage).message_create.source_app_id
    ];
  },
  get hashtags() {
    return (this.payload as RawDirectMessage).message_create.message_data
      .entities.hashtags;
  },
  get symbols() {
    return (this.payload as RawDirectMessage).message_create.message_data
      .entities.symbols;
  },
  get urls() {
    return (
      this.payload as RawDirectMessage
    ).message_create.message_data.entities.urls.map(polishUrlEntity);
  },
  get userMentions() {
    return (
      this.payload as RawDirectMessage
    ).message_create.message_data.entities.user_mentions.map(
      polishMentionEntity,
    );
  },
  get media() {
    const { attachment } = (this.payload as RawDirectMessage).message_create
      .message_data;
    return attachment?.type === 'media' ? polishMedia(attachment.media) : null;
  },
};

export interface MediaBase {
  /** The url to download media */
  url: string;
}

export const MediaBase: MediaBase = {
  get url() {
    return (this.payload as RawDirectMessage).message_create.message_data
      .attachment?.media?.media_url_https as string;
  },
};

export interface PhotoAttachment {
  /** The photo media object */
  photo: Photo;
}
export const PhotoAttachment: PhotoAttachment = {
  get photo() {
    return (this as DirectMessageCreate).media as Photo;
  },
};

export interface VideoAttachment {
  /** The video media object */
  video: Video;
}
export const VideoAttachment: VideoAttachment = {
  get video() {
    return (this as DirectMessageCreate).media as Video;
  },
};

export interface AnimatedGifAttachment {
  /** The animated gif media object */
  animatedGif: AnimatedGif;
}
export const AnimatedGifAttachment: AnimatedGifAttachment = {
  get animatedGif() {
    return (this as DirectMessageCreate).media as AnimatedGif;
  },
};

export interface QuickReply {
  /** The callback metadata set on the quick reply */
  callbackData: string;
}

export const QuickReply: QuickReply = {
  get callbackData(): string {
    return (this.payload as RawDirectMessage).message_create.message_data
      .quick_reply_response?.metadata as string;
  },
};

export interface DirectMessageAction {
  thread: DirectMessageChat;
  user: TwitterUser;
  recipient: TwitterUser;
  time: Date;
  usersMapping: Record<string, RawUser>;
}

export const DirectMessageAction: DirectMessageAction = {
  usersMapping: null as never,
  get thread() {
    return new DirectMessageChat(
      (this as EventBase).forUserId,
      (this.payload as RawDirectMessageAction).sender_id,
    );
  },
  get user() {
    const senderId = (this.payload as RawDirectMessageAction).sender_id;
    return new TwitterUser(
      senderId,
      (this as DirectMessageAction).usersMapping[senderId],
    );
  },
  get recipient() {
    const recipientId = (this.payload as RawDirectMessageAction).target
      .recipient_id;
    return new TwitterUser(
      recipientId,
      (this as DirectMessageAction).usersMapping[recipientId],
    );
  },
  get time() {
    return new Date((this.payload as RawDirectMessageAction).created_timestamp);
  },
};

export interface DirectMessageTyping {
  payload: RawDirectMessageAction;
}
export const DirectMessageTyping: DirectMessageTyping = {
  payload: null as never,
};

export interface DirectMessageMarkRead {
  payload: RawDirectMessageMarkRead;
  lastReadEventId: string;
}

export const DirectMessageMarkRead: DirectMessageMarkRead = {
  payload: null as never,
  get lastReadEventId() {
    return (this.payload as RawDirectMessageMarkRead).last_read_event_id;
  },
};

export interface DeleteTweet {
  payload: RawTweetDelete;
  thread: null;
  user: TwitterUser;
  statusId: string;
  time: Date;
}

export const DeleteTweet: DeleteTweet = {
  payload: null as never,
  thread: null,
  get user() {
    return new TwitterUser((this.payload as RawTweetDelete).status.user_id);
  },
  get statusId() {
    return (this.payload as RawTweetDelete).status.id;
  },
  get time() {
    return new Date((this.payload as RawTweetDelete).timestamp_ms);
  },
};

export interface Unknown {
  payload: any;
  thread: null;
  user: null;
}
export const Unknown: Unknown = {
  payload: null,
  thread: null,
  user: null,
};
