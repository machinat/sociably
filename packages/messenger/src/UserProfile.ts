import type { MachinatProfile } from '@machinat/core/base/Profiler';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import type { RawUserProfile } from './types';
import { MESSENGER } from './constant';

class MessengerUserProfile
  implements MachinatProfile, MarshallableInstance<RawUserProfile>
{
  static typeName = 'MessengerUserProfile';

  static fromJSONValue(data: RawUserProfile): MessengerUserProfile {
    return new MessengerUserProfile(data);
  }

  data: RawUserProfile;
  platform = MESSENGER;

  constructor(data: RawUserProfile) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get firstName(): string {
    return this.data.first_name;
  }

  get lastName(): string {
    return this.data.last_name;
  }

  get avatarUrl(): string {
    return this.data.profile_pic;
  }

  get languageCode(): undefined | string {
    return this.data.locale;
  }

  get timeZone(): undefined | number {
    return this.data.timezone;
  }

  get gender(): undefined | string {
    return this.data.gender;
  }

  toJSONValue(): RawUserProfile {
    return this.data;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return MessengerUserProfile.typeName;
  }
}

export default MessengerUserProfile;
