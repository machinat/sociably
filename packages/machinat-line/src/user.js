// @flow
import type { MachinatUser, MachinatUserProfile } from 'machinat/types';
import { LINE } from './constant';

export class LineUser implements MachinatUser {
  platform = LINE;
  channelId: string;
  userId: string;

  constructor(lineChannelId: string, userId: string) {
    this.channelId = lineChannelId;
    this.userId = userId;
  }

  get id() {
    return this.userId;
  }

  get uid() {
    return `line:${this.channelId}:${this.userId}`;
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
