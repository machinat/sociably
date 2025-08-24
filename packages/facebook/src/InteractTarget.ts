import type { SociablyThread } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler.js';
import FacebookPage from './Page.js';
import { FACEBOOK } from './constant.js';

type InteractTargetValue = {
  page: string;
  type?: string;
  id: string;
};

class FacebookInteractTarget
  implements SociablyThread, MarshallableInstance<InteractTargetValue>
{
  static typeName = 'FacebookInteractTarget';
  static fromJSONValue(val: InteractTargetValue): FacebookInteractTarget {
    const { page, id, type } = val;
    return new FacebookInteractTarget(page, id, type);
  }

  pageId: string;
  type?: string;
  id: string;

  readonly platform = FACEBOOK;
  readonly $$typeofThread = true;

  constructor(pageId: string, id: string, objectType?: string) {
    this.pageId = pageId;
    this.type = objectType;
    this.id = id;
  }

  get page(): FacebookPage {
    return new FacebookPage(this.pageId);
  }

  get uid(): string {
    return `${FACEBOOK}.${this.pageId}.${this.id}`;
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
