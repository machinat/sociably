// @flow
import type { MachinatUser, MachinatUserProfile } from 'machinat/types';
import { LINE } from './constant';

export class LineUser implements MachinatUser {
  source: { userId: string };
  platform = LINE;

  constructor(source: { userId: string }) {
    this.source = source;
  }

  get id() {
    return this.source.userId;
  }
}

type RawLineUserProfile = {
  displayName: string,
  userId: string,
  pictureUrl?: string,
  statusMessage?: string,
};

export class LineUserProfile implements MachinatUserProfile {
  raw: RawLineUserProfile;
  platform = LINE;

  constructor(raw: RawLineUserProfile) {
    this.raw = raw;
  }

  get id() {
    return this.raw.userId;
  }

  get name() {
    return this.raw.displayName;
  }

  get pictureURL() {
    return this.raw.pictureUrl;
  }

  get statusMessage() {
    return this.raw.statusMessage;
  }
}
