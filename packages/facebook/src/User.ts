import type { SociablyUser } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK } from './constant';

type FacebookUserValue = {
  page: string;
  id: string;
};

export default class FacebookUser
  implements SociablyUser, MarshallableInstance<FacebookUserValue>
{
  static typeName = 'FacebookUser';

  static fromJSONValue(value: FacebookUserValue): FacebookUser {
    const { page, id } = value;
    return new FacebookUser(page, id);
  }

  platform = FACEBOOK;
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
