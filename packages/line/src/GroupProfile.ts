import type { MachinatProfile } from '@machinat/core/base/Profiler';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { LINE } from './constant';

export type LineGroupSummary = {
  groupId: string;
  groupName: string;
  pictureUrl: string;
};

class LineGroupProfile
  implements MachinatProfile, MarshallableInstance<LineGroupSummary>
{
  static typeName = 'LineGroupProfile';

  static fromJSONValue(data: LineGroupSummary): LineGroupProfile {
    return new LineGroupProfile(data);
  }

  data: LineGroupSummary;
  platform = LINE;
  firstName = undefined;
  lastName = undefined;
  languageCode = undefined;
  timeZone = undefined;

  constructor(data: LineGroupSummary) {
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

  toJSONValue(): LineGroupSummary {
    return this.data;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return LineGroupProfile.typeName;
  }
}

export default LineGroupProfile;
