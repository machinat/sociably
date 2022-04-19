/* eslint-disable camelcase */
import type {
  PlatformUtilities,
  EventMiddleware,
  DispatchMiddleware,
  MachinatNode,
  NativeComponent,
} from '@machinat/core';
import { IntermediateSegment, UnitSegment } from '@machinat/core/renderer';
import { DispatchFrame, DispatchResponse } from '@machinat/core/engine';
import type { WebhookMetadata } from '@machinat/http/webhook';
import type { TwitterEvent } from './event/types';
import type TwitterChat from './Chat';
import type TweetTarget from './TweetTarget';
import type { TwitterBot } from './Bot';
import type TwitterUser from './User';

export type TwitterChannel = TweetTarget | TwitterChat;

export type TwitterPlatformConfigs = {
  /** The id of Twitter app */
  appId: string;
  /** The key of Twitter app */
  appKey: string;
  /** The secret of Twitter app */
  appSecret: string;
  /** The bearer token of Twitter app */
  bearerToken: string;
  /** The access token for the agent user */
  accessToken: string;
  /** The secret of the access token */
  accessSecret: string;
  /** The webhook path to receive events. Default to `/` */
  webhookPath?: string;
  /** The max API request connections at the same time */
  maxRequestConnections?: number;
  /** To verify the request by the signature or not. Default to `true` */
  shouldVerifyRequest?: boolean;
  eventMiddlewares?: TwitterEventMiddleware[];
  dispatchMiddlewares?: TwitterDispatchMiddleware[];
};

export type MediaType = 'photo' | 'video' | 'animated_gif';

export type IdMediaSource = {
  type: 'id';
  id: string;
};

export type UrlMediaSource = {
  type: 'url';
  url: string;
  parameters: { [k: string]: undefined | string | number };
  assetTag?: string;
};

export type FileMediaSource = {
  type: 'file';
  parameters: { [k: string]: undefined | string | number };
  fileData: Buffer | NodeJS.ReadableStream;
  assetTag?: string;
};

export type MediaSource = IdMediaSource | UrlMediaSource | FileMediaSource;

export type MediaAttachment = {
  type: MediaType;
  source: MediaSource;
};

export type TwitterApiRequest = {
  method: string;
  href: string;
  parameters: any;
};

type AccomplishRequestFn = (
  target: TwitterChannel,
  request: TwitterApiRequest,
  uploadedMedia: null | string[]
) => TwitterApiRequest;

export type TwitterJob = {
  key: undefined | string;
  request: TwitterApiRequest;
  target: TwitterChannel;
  asApplication: boolean;
  refreshTarget:
    | null
    | ((
        currentTarget: TwitterChannel,
        result: unknown
      ) => null | TwitterChannel);
  accomplishRequest: null | AccomplishRequestFn;
  mediaSources: null | MediaSource[];
};

export type DirectMessageSegmentValue = {
  type: 'dm';
  request: TwitterApiRequest;
  accomplishRequest: null | AccomplishRequestFn;
  mediaSources: null | MediaSource[];
};

export type TweetSegmentValue = {
  type: 'tweet';
  request: TwitterApiRequest;
  accomplishRequest: null | AccomplishRequestFn;
  mediaSources: null | MediaSource[];
};

export type ActionSegmentValue = {
  type: 'action';
  request: TwitterApiRequest;
  accomplishRequest: null | AccomplishRequestFn;
  mediaSources: null | MediaSource[];
};

export type MediaSegmentValue = {
  type: 'media';
  attachment: MediaAttachment;
};

export type TwitterSegmentValue =
  | DirectMessageSegmentValue
  | TweetSegmentValue
  | ActionSegmentValue
  | MediaSegmentValue;

export type TwitterComponent<
  Props,
  Segment extends IntermediateSegment<TwitterSegmentValue> = UnitSegment<TwitterSegmentValue>
> = NativeComponent<Props, Segment>;

export type TwitterApiResult = {
  code: number;
  body: unknown;
  uploadedMedia:
    | null
    | {
        source: MediaSource;
        assetTag: undefined | string;
        result: MediaUploadResult;
      }[];
};

export type TwitterDispatchResponse = DispatchResponse<
  TwitterJob,
  TwitterApiResult
>;

export type TwitterEventContext = {
  platform: 'twitter';
  event: TwitterEvent;
  metadata: WebhookMetadata;
  bot: TwitterBot;
  reply(node: MachinatNode): Promise<null | TwitterDispatchResponse>;
};

export type TwitterEventMiddleware = EventMiddleware<TwitterEventContext, null>;

export type TwitterDispatchFrame = DispatchFrame<TwitterChannel, TwitterJob>;

export type TwitterDispatchMiddleware = DispatchMiddleware<
  TwitterJob,
  TwitterDispatchFrame,
  TwitterApiResult
>;

export type TwitterPlatformUtilities = PlatformUtilities<
  TwitterEventContext,
  null,
  TwitterJob,
  TwitterDispatchFrame,
  TwitterApiResult
>;

export type RenderMediaResponse = {
  type: MediaType;
  id: string;
  source: MediaSource;
  result: MediaUploadResult;
};

export type NumberPairs = [number, number];

export type HashtagEntity = {
  /** Name of the hashtag, minus the leading ‘#’ character */
  text: string;
  /** An array of integers indicating the offsets within the Tweet text where the hashtag begins and ends. The first integer represents the location of the # character in the Tweet text string. The second integer represents the location of the first character after the hashtag. Therefore the difference between the two numbers will be the length of the hashtag name plus one (for the ‘#’ character). Example: `[32,38]` */
  indices: NumberPairs;
};

export type SymbolEntity = {
  /** Name of the cashhtag, minus the leading ‘$’ character */
  text: string;
  /** An array of integers indicating the offsets within the Tweet text where the symbol/cashtag begins and ends. The first integer represents the location of the $ character in the Tweet text string. The second integer represents the location of the first character after the cashtag. Therefore the difference between the two numbers will be the length of the hashtag name plus one (for the ‘$’ character). Example: `[12,17]` */
  indices: NumberPairs;
};

export type UrlEntity = {
  /** Wrapped URL, corresponding to the value embedded directly into the raw Tweet text, and the values for the indices parameter. Example: `https://t.co/yzocNFvJuL` */
  url: string;
  /** URL pasted/typed into Tweet. Example: `bit.ly/2so49n2` */
  displayUrl: string;
  /** Expanded version of `displayUrl` . Example: `http://bit.ly/2so49n2` */
  expandedUrl: string;
  /** An array of integers representing offsets within the Tweet text where the URL begins and ends. The first integer represents the location of the first character of the URL in the Tweet text. The second integer represents the location of the first non-URL character after the end of the URL. Example: `[30,53]` */
  indices: NumberPairs;
};

export type MentionEntity = {
  /** The mentioned user object */
  user: TwitterUser;
  /** ID of the mentioned user */
  id: string;
  /** Display name of the referenced user */
  name: string;
  /** Screen name of the referenced user */
  screenName: string;
  /** An array of integers representing the offsets within the Tweet text where the user reference begins and ends. The first integer represents the location of the ‘@’ character of the user mention. The second integer represents the location of the first non-screenname character following the user mention. Example: `[4,15]` */
  indices: [number, number];
};

export type PollEntity = {
  /** An array of options, each having a poll position, and the text for that position */
  options: {
    position: number;
    text: string;
  }[];
  /** The Date representing when poll ends */
  endTime: Date;
  /** Duration of poll in minutes */
  durationMinutes: number;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Place = {
  /** ID representing this place. Note that this is represented as a string */
  id: string;
  /** URL representing the location of additional place metadata for this place */
  url: string;
  /** The type of location represented by this place */
  type: string;
  /** Short human-readable representation of the place’s name */
  name: string;
  /** Full human-readable representation of the place’s name */
  fullName: string;
  /** Shortened country code representing the country containing this place */
  countryCode: string;
  /** Name of the country containing this place */
  country: string;
  /** A bounding box of coordinates which encloses this place */
  boundingCoordinates: Coordinates[];
};

export type ReplyToTarget = {
  tweetId: string;
  userId: string;
  screenName: string;
  user: TwitterUser;
};

export type Media = {
  id: string;
  /** Type of uploaded media */
  type: MediaType;
  /** Wrapped URL for the media link. This corresponds with the URL embedded directly into the raw Tweet text, and the values for the indices parameter. Example: `http://t.co/rJC5Pxsu` */
  inlineUrl: string;
  /** URL of the media to display to clients. Example: `pic.twitter.com/rJC5Pxsu` */
  displayUrl: string;
  /** An expanded version of display_url. Links to the media display page. Example: `http://twitter.com/yunorno/status/114080493036773378/photo/1` */
  expandedUrl: string;
  /** An array of integers indicating the offsets within the Tweet text where the URL begins and ends. The first integer represents the location of the first character of the URL in the Tweet text. The second integer represents the location of the first non-URL character occurring after the URL (or the end of the string if the URL is the last part of the Tweet text). Example: `[15,35]` */
  indices: NumberPairs;
  /** The URL pointing directly to the uploaded media file, for embedding on https pages. */
  downloadUrl: string;
  /** An object showing available sizes for the media file */
  sizes: RawMediaSizeChoices;
  /** For Tweets containing media that was originally associated with a different tweet, this string-based ID points to the original Tweet */
  sourceStatusId?: string;
};

export type AnimateInfo = {
  /** Aspect ratio of the video. Example: `[9, 16]` */
  aspectRatio: NumberPairs;
  /** Video duration in milliseconds */
  durationMs: number;
  /** Source variants */
  variants: {
    /** The bitrate of the source */
    bitrate: number;
    /** The content tyoe of the source */
    contentType: string;
    /** The url of the source */
    url: string;
  }[];
};

export type Photo = Media & { type: 'photo' };
export type Video = Media & {
  type: 'video';
  videoInfo: null | AnimateInfo;
  /** When an advertiser chooses to limit video playback to just Twitter owned and operated platforms, the `videoInfo` is replaced with `additionalMediaInfo` */
  additionalMediaInfo: null | {
    title: string;
    description: string;
    embeddable: boolean;
    monetizable: boolean;
  };
};
export type AnimatedGif = Media & {
  type: 'animated_gif';
  videoInfo: AnimateInfo;
};

export type FailApiResult = {
  title: string;
  detail: string;
  type: string;
  errors: any[];
  client_id?: string;
  required_enrollment?: string;
  registration_url?: string;
  reason: string;
};

export type MediaUploadResult = {
  media_id: number | BigInt;
  media_id_string: string;
  expires_after_secs: number;
  size: number;
  processing_info?: {
    state: 'pending';
    check_after_secs: number;
  };
  video?: {
    video_type: string;
  };
};

export type TweetResult = {
  data: {
    id: string;
    text: string;
  };
};

export type RawUser = {
  id: number | BigInt;
  id_str: string;
  name: string;
  screen_name: string;
  location?: string;
  derived?: {
    location: { [k: string]: string };
  };
  status?: RawTweet;
  entities?: {
    url: { urls: RawUrlEntity[] };
    description: { urls: RawUrlEntity[] };
  };
  url?: string;
  description?: string;
  protected: boolean;
  verified: boolean;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  favourites_count: number;
  statuses_count: number;
  created_at: string;
  profile_banner_url: null | string;
  profile_image_url_https: string;
  default_profile: boolean;
  default_profile_image: boolean;
  withheld_in_countries?: string[];
  withheld_scope?: string;
};

export type RawSettings = {
  always_use_https: boolean;
  discoverable_by_email: boolean;
  geo_enabled: boolean;
  language: string;
  protected: boolean;
  screen_name: string;
  show_all_inline_media: boolean;
  sleep_time: {
    enabled: boolean;
    end_time: null | number;
    start_time: null | number;
  };
  time_zone: {
    name: string;
    tzinfo_name: string;
    utc_offset: number;
  };
  trend_location: [
    {
      country: string;
      countryCode: string;
      name: string;
      parentid: number;
      placeType: {
        code: number;
        name: number;
      };
      url: string;
      woeid: number;
    }
  ];
  use_cookie_personalization: boolean;
  allow_contributor_request: string;
};

export type RawPlace = {
  id: string;
  url: string;
  place_type: string;
  name: string;
  full_name: string;
  country_code: string;
  country: string;
  bounding_box: {
    type: 'Polygon';
    coordinates: NumberPairs[];
  };
  attributes?: {};
};

export type RawUrlEntity = {
  url: string;
  expanded_url: string;
  display_url: string;
  indices: NumberPairs;
};

export type RawEntities = {
  hashtags: {
    text: string;
    indices: NumberPairs;
  }[];
  media: RawMedia[];
  urls: RawUrlEntity[];
  user_mentions: {
    id: number | BigInt;
    id_str: string;
    name: string;
    screen_name: string;
    indices: NumberPairs;
  }[];
  symbols: {
    text: string;
    indices: NumberPairs;
  }[];
  polls?: {
    options: {
      position: number;
      text: string;
    }[];
    end_datetime: string;
    duration_minutes: number;
  }[];
};

export type RawMedia = {
  display_url: string;
  expanded_url: string;
  id: number | BigInt;
  id_str: string;
  indices: NumberPairs;
  media_url: string;
  media_url_https: string;
  sizes: RawMediaSizeChoices;
  source_status_id?: number | BigInt;
  source_status_id_str?: string;
  type: MediaType;
  url: string;
  video_info?: {
    aspect_ratio: NumberPairs;
    duration_millis: number;
    variants: {
      bitrate: number;
      content_type: string;
      url: string;
    }[];
  };
  additional_media_info?: {
    title: string;
    description: string;
    embeddable: boolean;
    monetizable: boolean;
  };
};

export type RawMediaSize = {
  w: number;
  h: number;
  resize: string;
};

export type RawMediaSizeChoices = {
  thumb: RawMediaSize;
  large: RawMediaSize;
  medium: RawMediaSize;
  small: RawMediaSize;
};

export type RawTweet = {
  created_at: string;
  id: number | BigInt;
  id_str: string;
  text: string;
  source: string;
  truncated: boolean;
  in_reply_to_status_id?: number | BigInt;
  in_reply_to_status_id_str?: string;
  in_reply_to_user_id?: number | BigInt;
  in_reply_to_user_id_str?: string;
  in_reply_to_screen_name?: string;
  user: RawUser;
  coordinates?: {
    type: 'Point';
    coordinates: NumberPairs;
  };
  place?: RawPlace;
  quoted_status_id: number | BigInt;
  quoted_status_id_str: string;
  is_quote_status: boolean;
  quoted_status?: RawTweet;
  retweeted_status?: RawTweet;
  quote_count?: number;
  reply_count: number;
  retweet_count: number;
  favorite_count?: number;
  entities: RawEntities;
  extended_entities: {
    media: RawMedia[];
  };
  favorited: boolean;
  retweeted: boolean;
  possibly_sensitive?: boolean;
  filter_level: string;
  lang?: string;
};

export type RawTweetCreateEvent = {
  for_user_id: string;
  user_has_blocked?: 'true' | 'false';
  tweet_create_events: RawTweet[];
};

export type RawFavorite = {
  id: string;
  created_at: string;
  timestamp_ms: number;
  favorited_status: RawTweet;
  user: RawUser;
};

export type RawFavoriteEvent = {
  for_user_id: string;
  favorite_events: RawFavorite[];
};

export type RawActionInfo = {
  created_timestamp: number;
  target: RawUser;
  source: RawUser;
};

export type RawFollowStatueEvent = {
  for_user_id: string;
  follow_events: ({ type: 'follow' | 'unfollow' } & RawActionInfo)[];
};

export type RawBlockStatusEvent = {
  for_user_id: string;
  block_events: ({ type: 'block' | 'unblock' } & RawActionInfo)[];
};

export type RawMuteStatusEvent = {
  for_user_id: string;
  mute_events: ({ type: 'mute' | 'unmute' } & RawActionInfo)[];
};

export type RawUserRevokeEvent = {
  user_event: {
    revoke: {
      date_time: number;
      target: {
        app_id: string;
      };
      source: {
        user_id: string;
      };
    };
  };
};

export type RawDirectMessage = {
  type: 'message_create';
  id: string;
  created_timestamp: string;
  message_create: {
    target: {
      recipient_id: string;
    };
    sender_id: string;
    initiated_via?: {
      tweet_id?: string;
      welcome_message_id?: string;
    };
    source_app_id: string;
    message_data: {
      text: string;
      entities: RawEntities;
      attachment?: {
        type: 'media';
        media: RawMedia;
      };
      quick_reply_response?: {
        type: 'options';
        metadata: string;
      };
    };
  };
};

export type RawApp = {
  id: string;
  name: string;
  url: string;
};

export type RawDirectMessageEvent = {
  for_user_id: string;
  direct_message_events: RawDirectMessage[];
  apps: { [id: string]: RawApp };
  users: { [id: string]: RawUser };
};

export type RawDirectMessageAction = {
  created_timestamp: string;
  sender_id: string;
  target: {
    recipient_id: string;
  };
  users: { [id: string]: RawUser };
};

export type RawDirectMessageIndicateTypingEvent = {
  for_user_id: string;
  direct_message_indicate_typing_events: RawDirectMessageAction[];
  users: { [id: string]: RawUser };
};

export type RawDirectMessageMarkRead = RawDirectMessageAction & {
  last_read_event_id: string;
};

export type RawDirectMessageMarkReadEvent = {
  for_user_id: string;
  direct_message_mark_read_events: RawDirectMessageMarkRead[];
  users: {
    [id: string]: RawUser;
  };
};

export type RawTweetDelete = {
  status: {
    id: string;
    user_id: string;
  };
  timestamp_ms: string;
};

export type RawTweetDeleteEvent = {
  for_user_id: string;
  tweet_delete_events: RawTweetDelete[];
};

export type RawTwitterEventBody =
  | RawTweetCreateEvent
  | RawFavoriteEvent
  | RawFollowStatueEvent
  | RawBlockStatusEvent
  | RawMuteStatusEvent
  | RawUserRevokeEvent
  | RawDirectMessageEvent
  | RawDirectMessageMarkReadEvent
  | RawDirectMessageIndicateTypingEvent
  | RawTweetDeleteEvent;
