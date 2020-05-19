// @flow
import type { MachinatUserProfile } from '@machinat/core/base/ProfileFetcherI';
import type { MessengerRawUserProfile } from '../types';
import { MESSENGER } from '../constant';

export default class MessengerUserProfile implements MachinatUserProfile {
  data: MessengerRawUserProfile;
  platform = MESSENGER;

  constructor(rawProfile: MessengerRawUserProfile) {
    this.data = rawProfile;
  }

  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.name;
  }

  get firstName() {
    return this.data.first_name;
  }

  get lastName() {
    return this.data.last_name;
  }

  get pictureURL() {
    return this.data.profile_pic;
  }

  get locale() {
    return this.data.locale;
  }

  get timezone() {
    return this.data.timezone;
  }

  get gender() {
    return this.data.gender;
  }

  toJSON() {
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
