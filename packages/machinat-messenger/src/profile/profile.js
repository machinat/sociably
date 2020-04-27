// @flow
import type { MachinatUserProfile } from '@machinat/core/base/ProfileFetcherI';
import type { MessengerRawUserProfile } from '../types';
import { MESSENGER } from '../constant';

export default class MessengerUserProfile implements MachinatUserProfile {
  rawData: MessengerRawUserProfile;
  platform = MESSENGER;

  constructor(rawProfile: MessengerRawUserProfile) {
    this.rawData = rawProfile;
  }

  get id() {
    return this.rawData.id;
  }

  get name() {
    return this.rawData.name;
  }

  get firstName() {
    return this.rawData.first_name;
  }

  get lastName() {
    return this.rawData.last_name;
  }

  get pictureURL() {
    return this.rawData.profile_pic;
  }

  get locale() {
    return this.rawData.locale;
  }

  get timezone() {
    return this.rawData.timezone;
  }

  get gender() {
    return this.rawData.gender;
  }
}
