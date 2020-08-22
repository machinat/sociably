import { MachinatUserProfile } from '@machinat/core/base/UserProfilerI';
import { LINE } from '../constant';
import type { RawLineUserProfile } from './types';

export default class LineUserProfile implements MachinatUserProfile {
  data: RawLineUserProfile;
  platform = LINE;

  constructor(data: RawLineUserProfile) {
    this.data = data;
  }

  get id(): string {
    return this.data.userId;
  }

  get name(): string {
    return this.data.displayName;
  }

  get pictureURL(): undefined | string {
    return this.data.pictureUrl;
  }

  get statusMessage(): undefined | string {
    return this.data.statusMessage;
  }

  toJSON(): any {
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
