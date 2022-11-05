import type { SociablyChannel } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK } from './constant';

type ObjectTargetValue = {
  page: string;
  type?: string;
  id: string;
};

class FacebookObjectTarget
  implements SociablyChannel, MarshallableInstance<ObjectTargetValue>
{
  static typeName = 'FacebookObjectTarget';
  static fromJSONValue(val: ObjectTargetValue): FacebookObjectTarget {
    const { page, id, type } = val;
    return new FacebookObjectTarget(page, id, type);
  }

  pageId: string;
  type?: string;
  id: string;
  platform = FACEBOOK;

  constructor(pageId: string, id: string, objectType?: string) {
    this.pageId = pageId;
    this.type = objectType;
    this.id = id;
  }

  get uid(): string {
    return `${FACEBOOK}.${this.pageId}.${this.id}`;
  }

  toJSONValue(): ObjectTargetValue {
    const { pageId, id, type } = this;
    return { page: pageId, id, type };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookObjectTarget.typeName;
  }
}

export default FacebookObjectTarget;
