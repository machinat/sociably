import type { SociablyProfile } from '@sociably/core/base/Profiler';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import type { RawUserProfile } from './types.js';
import { INSTAGRAM } from './constant.js';

class InstagramUserProfile
  implements SociablyProfile, MarshallableInstance<RawUserProfile>
{
  static typeName = 'IgUserProfile';

  static fromJSONValue(data: RawUserProfile): InstagramUserProfile {
    return new InstagramUserProfile(data);
  }

  data: RawUserProfile;
  platform = INSTAGRAM;

  firstName = undefined;
  lastName = undefined;
  languageCode = undefined;
  timeZone = undefined;

  constructor(data: RawUserProfile) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name || this.data.username;
  }

  get username(): string {
    return this.data.username;
  }

  get avatarUrl(): undefined | string {
    return this.data.profile_pic;
  }

  get isVerifiedUser(): boolean {
    return this.data.is_verified_user;
  }

  get followerCount(): number {
    return this.data.follower_count;
  }

  get isUserFollowBusiness(): boolean {
    return this.data.is_user_follow_business;
  }

  get isBusinessFollowUser(): boolean {
    return this.data.is_business_follow_user;
  }

  toJSONValue(): RawUserProfile {
    return this.data;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return InstagramUserProfile.typeName;
  }
}

export default InstagramUserProfile;
