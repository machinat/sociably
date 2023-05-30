import type { SociablyProfile } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import Tweet from './Tweet.js';
import { TWITTER } from './constant.js';
import type { RawUser, RawSettings } from './types.js';

type SerializedUserProfile = {
  user: RawUser;
  settings: undefined | RawSettings;
};

export default class TwitterUserProfile
  implements SociablyProfile, MarshallableInstance<SerializedUserProfile>
{
  static typeName = 'TwtrUserProfile';
  static fromJSONValue({
    user,
    settings,
  }: SerializedUserProfile): TwitterUserProfile {
    return new TwitterUserProfile(user, settings);
  }

  platform = TWITTER;
  data: {
    user: RawUser;
    settings: undefined | RawSettings;
  };

  firstName = undefined;
  lastName = undefined;

  constructor(user: RawUser, settings?: RawSettings) {
    this.data = { user, settings };
  }

  get avatarUrl(): string {
    return this.data.user.profile_image_url_https;
  }

  get id(): string {
    return this.data.user.id_str;
  }

  get name(): string {
    return this.data.user.name;
  }

  get timeZone(): undefined | number {
    const offsetInMin = this.data.settings?.time_zone?.utc_offset;
    return offsetInMin ? offsetInMin / 3600 : undefined;
  }

  get languageCode(): undefined | string {
    return this.data.settings?.language;
  }

  get screenName(): string {
    return this.data.user.screen_name;
  }

  get location(): undefined | string {
    return this.data.user.location || undefined;
  }

  get url(): undefined | string {
    return this.data.user.url || undefined;
  }

  get description(): undefined | string {
    return this.data.user.description || undefined;
  }

  get protected(): boolean {
    return this.data.user.protected;
  }

  get verified(): boolean {
    return this.data.user.verified;
  }

  get followersCount(): number {
    return this.data.user.followers_count;
  }

  get friendsCount(): number {
    return this.data.user.friends_count;
  }

  get listedCount(): number {
    return this.data.user.listed_count;
  }

  get favouritesCount(): number {
    return this.data.user.favourites_count;
  }

  get statusesCount(): number {
    return this.data.user.statuses_count;
  }

  get createdAt(): Date {
    return new Date(this.data.user.created_at);
  }

  get profileBannerUrl(): undefined | string {
    return this.data.user.profile_banner_url || undefined;
  }

  get profileImageUrl(): string {
    return this.data.user.profile_image_url_https;
  }

  get defaultProfile(): boolean {
    return this.data.user.default_profile;
  }

  get defaultProfileImage(): boolean {
    return this.data.user.default_profile_image;
  }

  get withheldInCountries(): null | string[] {
    return this.data.user.withheld_in_countries || null;
  }

  get withheldScope(): undefined | string {
    return this.data.user.withheld_scope || undefined;
  }

  get currentStatus(): null | Tweet {
    return this.data.user.status ? new Tweet(this.data.user.status) : null;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterUserProfile.typeName;
  }

  toJSONValue(): SerializedUserProfile {
    return this.data;
  }
}
