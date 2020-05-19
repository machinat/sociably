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
  data: RawLineUserProfile;
  platform = LINE;

  constructor(data: RawLineUserProfile) {
    this.data = data;
  }

  get id() {
    return this.data.userId;
  }

  get name() {
    return this.data.displayName;
  }

  get pictureURL() {
    return this.data.pictureUrl;
  }

  get statusMessage() {
    return this.data.statusMessage;
  }

  toJSON() {
    const { data, id, name, pictureURL } = this;
    return {
      platform: LINE,
      data,
      id,
      name,
      pictureURL,
    };
  }
}
