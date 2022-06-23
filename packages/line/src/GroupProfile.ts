import type { SociablyProfile } from '@sociably/core/base/Profiler';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { LINE } from './constant';

export type LineGroupData = {
  groupId: string;
  groupName: string;
  pictureUrl: string;
};

type GroupProfileValue = {
  data: LineGroupData;
};

class LineGroupProfile
  implements SociablyProfile, MarshallableInstance<GroupProfileValue>
{
  static typeName = 'LineGroupProfile';

  static fromJSONValue({ data }: GroupProfileValue): LineGroupProfile {
    return new LineGroupProfile(data);
  }

  data: LineGroupData;
  platform = LINE;
  firstName = undefined;
  lastName = undefined;
  languageCode = undefined;
  timeZone = undefined;

  constructor(data: LineGroupData) {
    this.data = data;
  }

  get id(): string {
    return this.data.groupId;
  }

  get name(): string {
    return this.data.groupName;
  }

  get avatarUrl(): undefined | string {
    return this.data.pictureUrl;
  }

  toJSONValue(): GroupProfileValue {
    return { data: this.data };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return LineGroupProfile.typeName;
  }
}

export default LineGroupProfile;
