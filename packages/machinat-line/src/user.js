// @flow
import type { MachinatUser, MachinatUserProfile } from '@machinat/core/types';
import { LINE } from './constant';
import type { RawLineUserProfile } from './types';

export class LineUser implements MachinatUser {
  platform = LINE;
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  get id() {
    return this.userId;
  }

  get uid() {
    return `line.*.${this.userId}`;
  }
}

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
