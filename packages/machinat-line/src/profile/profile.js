// @flow
import type { MachinatUserProfile } from '@machinat/core/base/ProfileFetcherI';
import { LINE } from '../constant';

export type RawLineUserProfile = {
  displayName: string,
  userId: string,
  language?: string,
  pictureUrl?: string,
  statusMessage?: string,
};

export default class LineUserProfile implements MachinatUserProfile {
  rawData: RawLineUserProfile;
  platform = LINE;

  constructor(rawData: RawLineUserProfile) {
    this.rawData = rawData;
  }

  get id() {
    return this.rawData.userId;
  }

  get name() {
    return this.rawData.displayName;
  }

  get pictureURL() {
    return this.rawData.pictureUrl;
  }

  get statusMessage() {
    return this.rawData.statusMessage;
  }
}
