import type { MachinatProfile } from '@machinat/core/base/Profiler';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import type { LineRawUserProfile } from './types';
import { LINE } from './constant';

class LineUserProfile
  implements MachinatProfile, MarshallableInstance<LineRawUserProfile>
{
  static typeName = 'LineUserProfile';

  static fromJSONValue(data: LineRawUserProfile): LineUserProfile {
    return new LineUserProfile(data);
  }

  data: LineRawUserProfile;
  platform = LINE;
  firstName = undefined;
  lastName = undefined;
  timeZone = undefined;

  constructor(data: LineRawUserProfile) {
    this.data = data;
  }

  get id(): string {
    return this.data.userId;
  }

  get name(): string {
    return this.data.displayName;
  }

  get avatarUrl(): undefined | string {
    return this.data.pictureUrl;
  }

  get languageCode(): undefined | string {
    return this.data.language;
  }

  get statusMessage(): undefined | string {
    return this.data.statusMessage;
  }

  toJSONValue(): LineRawUserProfile {
    return this.data;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return LineUserProfile.typeName;
  }
}

export default LineUserProfile;