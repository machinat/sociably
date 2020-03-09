// @flow
import type { MachinatUser, MachinatUserProfile } from '@machinat/core/types';
import { MESSENGER } from './constant';
import type { MessengerRawUserProfile } from './types';

export class MessengerUser implements MachinatUser {
  platform = MESSENGER;
  pageId: string;
  psid: string;

  constructor(pageId: string | number, psid: string) {
    this.pageId = String(pageId);
    this.psid = psid;
  }

  get id() {
    return this.psid;
  }

  get uid() {
    return `messenger:${this.pageId}:${this.psid}`;
  }
}

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
