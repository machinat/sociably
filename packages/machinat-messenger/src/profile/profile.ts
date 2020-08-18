import type { MachinatUserProfile } from '@machinat/core/base/UserProfilerI';
import type { MessengerRawUserProfile } from '../types';
import { MESSENGER } from '../constant';

export default class MessengerUserProfile implements MachinatUserProfile {
  data: MessengerRawUserProfile;
  platform = MESSENGER;

  constructor(rawProfile: MessengerRawUserProfile) {
    this.data = rawProfile;
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

  get pictureURL(): string {
    return this.data.profile_pic;
  }

  get locale(): undefined | string {
    return this.data.locale;
  }

  get timezone(): undefined | string {
    return this.data.timezone;
  }

  get gender(): undefined | string {
    return this.data.gender;
  }

  toJSON(): any {
    const { data, id, name, pictureURL } = this;
    return {
      platform: MESSENGER,
      data,
      id,
      name,
      pictureURL,
    };
  }
}
