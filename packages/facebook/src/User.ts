import type { SociablyUser, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK, FB } from './constant.js';

type FacebookUserValue = {
  page: string;
  id: string;
};

export default class FacebookUser
  implements SociablyUser, MarshallableInstance<FacebookUserValue>
{
  static typeName = 'FbUser';

  static fromJSONValue(value: FacebookUserValue): FacebookUser {
    const { page, id } = value;
    return new FacebookUser(page, id);
  }

  readonly platform = FACEBOOK;
  readonly $$typeofUser = true;
  pageId: string;
  id: string;

  constructor(pageId: string, id: string) {
    this.pageId = pageId;
    this.id = id;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      $$typeof: ['user'],
      platform: FACEBOOK,
      scopeId: this.pageId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${FB}.${this.pageId}.${this.id}`;
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
