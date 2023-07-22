import type { UniqueOmniIdentifier } from '@sociably/core';
import { MessengerUser } from '@sociably/messenger';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import FacebookPage from './Page.js';
import { FACEBOOK, FB } from './constant.js';

type FacebookUserValue = {
  page: string;
  id: string;
};

export default class FacebookUser
  implements MessengerUser, MarshallableInstance<FacebookUserValue>
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

  get page(): FacebookPage {
    return new FacebookPage(this.pageId);
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
