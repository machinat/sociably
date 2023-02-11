import type { SociablyChannel, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK, FB } from './constant';

type InteractTargetValue = {
  page: string;
  type?: string;
  id: string;
};

class FacebookInteractTarget
  implements SociablyChannel, MarshallableInstance<InteractTargetValue>
{
  static typeName = 'FbInteractTarget';
  static fromJSONValue(val: InteractTargetValue): FacebookInteractTarget {
    const { page, id, type } = val;
    return new FacebookInteractTarget(page, id, type);
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

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: FACEBOOK,
      scopeId: this.pageId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${FB}.${this.pageId}.${this.id}`;
  }

  toJSONValue(): InteractTargetValue {
    const { pageId, id, type } = this;
    return { page: pageId, id, type };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookInteractTarget.typeName;
  }
}

export default FacebookInteractTarget;
