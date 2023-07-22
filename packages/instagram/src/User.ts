import type { UniqueOmniIdentifier } from '@sociably/core';
import { MessengerUser } from '@sociably/messenger';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import InstagramPage from './Page.js';
import { INSTAGRAM, IG } from './constant.js';

type InstagramUserValue = {
  page: string;
  id: string;
};

export default class InstagramUser
  implements MessengerUser, MarshallableInstance<InstagramUserValue>
{
  static typeName = 'IgUser';

  static fromJSONValue(value: InstagramUserValue): InstagramUser {
    const { page, id } = value;
    return new InstagramUser(page, id);
  }

  readonly platform = INSTAGRAM;
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
      platform: INSTAGRAM,
      scopeId: this.pageId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${IG}.${this.pageId}.${this.id}`;
  }

  get page(): InstagramPage {
    return new InstagramPage(this.pageId);
  }

  toJSONValue(): InstagramUserValue {
    const { pageId, id } = this;
    return { page: pageId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return InstagramUser.typeName;
  }
}
