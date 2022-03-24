import TwitterUser from './User';
import polishMentionEntity from './utils/polishMentionEntity';
import polishUrlEntity from './utils/polishUrlEntity';
import polishMedia from './utils/polishMedia';
import type {
  RawTweet,
  Place,
  Coordinates,
  HashtagEntity,
  SymbolEntity,
  UrlEntity,
  MentionEntity,
  PollEntity,
  ReplyToTarget,
  Media,
  Photo,
  Video,
  AnimatedGif,
} from './types';

export default class Tweet {
  data: RawTweet;
  constructor(data: RawTweet) {
    this.data = data;
  }

  /** The id of the tweet */
  get id(): string {
    return this.data.id_str;
  }

  /** The user who create the tweet */
  get user(): TwitterUser {
    const rawUser = this.data.user;
    return new TwitterUser(rawUser.id_str, rawUser);
  }

  /** Time when this Tweet was created */
  get createdAt(): Date {
    return new Date(this.data.created_at);
  }

  /** The text of the status update. See [twitter-text](https://github.com/twitter/twitter-text/blob/master/rb/lib/twitter-text/regex.rb) for details on what characters are currently considered valid */
  get text(): string {
    return this.data.text;
  }

  /** Utility used to post the Tweet, as an HTML-formatted string. Tweets from the Twitter website have a source value of `'web'` */
  get source(): string {
    return this.data.source;
  }

  /** Indicates whether the value of the text parameter was truncated. In most cases, it's `false`  */
  get truncated(): boolean {
    return this.data.truncated;
  }

  /** The place that the tweet is associated (but not necessarily originating from) */
  get place(): null | Place {
    return this.data.place
      ? {
          id: this.data.place.id,
          url: this.data.place.url,
          type: this.data.place.place_type,
          name: this.data.place.name,
          fullName: this.data.place.full_name,
          countryCode: this.data.place.country_code,
          country: this.data.place.country,
          boundingCoordinates: this.data.place.bounding_box.coordinates.map(
            ([longitude, latitude]) => ({ longitude, latitude })
          ),
        }
      : null;
  }

  /** Represents the geographic location of this Tweet as reported by the user or client application */
  get coordinates(): null | Coordinates {
    if (!this.data.coordinates) {
      return null;
    }
    const [longitude, latitude] = this.data.coordinates.coordinates;
    return { longitude, latitude };
  }

  /** Indicates approximately how many times this Tweet has been quoted by Twitter users */
  get quoteCount(): undefined | number {
    return this.data.quote_count;
  }

  /** Number of times this Tweet has been replied to */
  get replyCount(): number {
    return this.data.reply_count;
  }

  /** Number of times this Tweet has been retweeted */
  get retweetCount(): number {
    return this.data.retweet_count;
  }

  /** Indicates approximately how many times this Tweet has been liked by Twitter users */
  get favoriteCount(): undefined | number {
    return this.data.favorite_count;
  }

  /** Indicates whether this Tweet has been liked by the authenticating user */
  get favorited(): boolean {
    return this.data.favorited;
  }

  /** Indicates whether this Tweet has been Retweeted by the authenticating user */
  get retweeted(): boolean {
    return this.data.retweeted;
  }

  /** This field only surfaces when a Tweet contains a link. The meaning of the field doesn’t pertain to the Tweet content itself, but instead it is an indicator that the URL contained in the Tweet may contain content or media identified as sensitive content */
  get possiblySensitive(): undefined | boolean {
    return this.data.possibly_sensitive;
  }

  /** Indicates the maximum value of the filter_level parameter which may be used and still stream this Tweet. So a value of medium will be streamed on none, low, and medium streams */
  get filterLevel(): string {
    return this.data.filter_level;
  }

  /** When present, indicates a BCP 47 language identifier corresponding to the machine-detected language of the Tweet text, or `'und'` if no language could be detected */
  get languageCode(): undefined | string {
    return this.data.lang;
  }

  /** Represents hashtags which have been parsed out of the Tweet text */
  get hashtags(): HashtagEntity[] {
    return this.data.entities.hashtags;
  }

  get symbols(): SymbolEntity[] {
    return this.data.entities.symbols;
  }

  /** Represents URLs included in the text of a Tweet */
  get urls(): UrlEntity[] {
    return this.data.entities.urls.map(polishUrlEntity);
  }

  get userMentions(): MentionEntity[] {
    return this.data.entities.user_mentions.map(polishMentionEntity);
  }

  /** Represents Twitter Polls included in the Tweet */
  get poll(): null | PollEntity {
    if (!this.data.entities.polls || this.data.entities.polls.length === 0) {
      return null;
    }
    const raw = this.data.entities.polls[0];
    return {
      options: raw.options,
      endTime: new Date(raw.end_datetime),
      durationMinutes: raw.duration_minutes,
    };
  }

  get replyTo(): null | ReplyToTarget {
    const tweetId = this.data.in_reply_to_status_id_str;
    if (!tweetId) {
      return null;
    }

    const userId = this.data.in_reply_to_user_id_str as string;
    const screenName = this.data.in_reply_to_screen_name as string;
    return {
      tweetId,
      userId,
      screenName,
      user: new TwitterUser(userId),
    };
  }

  /** The Tweet object of the original Tweet that was quoted */
  get quotedStatus(): null | Tweet {
    return this.data.quoted_status ? new Tweet(this.data.quoted_status) : null;
  }

  /** The original Tweet that was retweeted. Note that retweets of retweets do not show representations of the intermediary retweet, but only the original Tweet */
  get retweetedStatus(): null | Tweet {
    return this.data.retweeted_status
      ? new Tweet(this.data.retweeted_status)
      : null;
  }

  get video(): null | Video {
    if (this.data.extended_entities.media[0]?.type !== 'video') {
      return null;
    }
    return polishMedia(this.data.extended_entities.media[0]) as Video;
  }

  get animatedGif(): null | AnimatedGif {
    if (this.data.extended_entities.media[0]?.type !== 'animated_gif') {
      return null;
    }
    return polishMedia(this.data.extended_entities.media[0]) as AnimatedGif;
  }

  get photos(): null | Photo[] {
    if (this.data.extended_entities.media[0]?.type !== 'photo') {
      return null;
    }
    return this.data.extended_entities.media.map(polishMedia) as Photo[];
  }

  get media(): null | Media[] {
    return this.data.extended_entities.media.map(polishMedia);
  }
}
