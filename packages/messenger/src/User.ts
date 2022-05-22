import type { MachinatUser } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { MESSENGER, FACEBOOK } from './constant';

type FacebookUserValue = {
  page: string;
  id: string;
};

export default class FacebookUser
  implements MachinatUser, MarshallableInstance<FacebookUserValue>
{
  static typeName = 'FacebookUser';

  static fromJSONValue(value: FacebookUserValue): FacebookUser {
    const { page, id } = value;
    return new FacebookUser(page, id);
  }

  platform = MESSENGER;
  pageId: string;
  id: string;

  constructor(pageId: string, id: string) {
    this.pageId = pageId;
    this.id = id;
  }

  get uid(): string {
    return `${FACEBOOK}.${this.pageId}.${this.id}`;
  }

  toJSONValue(): FacebookUserValue {
    const { pageId, id } = this;
    return { page: pageId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookUser.typeName;
  }
}
