// @flow
import type { MachinatUser, MachinatUserProfile } from 'machinat/types';
import type { PSIDSource } from './types';
import { MESSENGER } from './constant';

export class MessengerUser implements MachinatUser {
  source: PSIDSource;
  platform = MESSENGER;

  constructor(source: PSIDSource) {
    this.source = source;
  }

  get id() {
    return this.source.id;
  }
}

type MessengerRawUserProfile = {
  id: string,
  name: string,
  first_name: string,
  last_name: string,
  profile_pic: string,
  locale?: string,
  timezone?: string,
  gender?: string,
};

export class MessengerUserProfile implements MachinatUserProfile {
  raw: MessengerRawUserProfile;
  platform = MESSENGER;

  constructor(rawProfile: MessengerRawUserProfile) {
    this.raw = rawProfile;
  }

  get id() {
    return this.raw.id;
  }

  get name() {
    return this.raw.name;
  }

  get firstName() {
    return this.raw.first_name;
  }

  get lastName() {
    return this.raw.last_name;
  }

  get pictureURL() {
    return this.raw.profile_pic;
  }

  get locale() {
    return this.raw.locale;
  }

  get timezone() {
    return this.raw.timezone;
  }

  get gender() {
    return this.raw.gender;
  }
}
