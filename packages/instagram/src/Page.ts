import type { UniqueOmniIdentifier } from '@sociably/core';
import type { MessengerPage } from '@sociably/messenger';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { INSTAGRAM, IG } from './constant.js';

type InstagramPageValue = {
  page: string;
};

class InstagramPage
  implements MessengerPage, MarshallableInstance<InstagramPageValue>
{
  static typeName = 'IgPage';
  static fromJSONValue(value: InstagramPageValue): InstagramPage {
    const { page } = value;
    return new InstagramPage(page);
  }

  id: string;
  username?: string;
  readonly platform = INSTAGRAM;
  readonly $$typeofChannel = true;

  constructor(pageId: string, username?: string) {
    this.id = pageId;
    this.username = username;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      $$typeof: ['channel'],
      platform: INSTAGRAM,
      id: this.id,
    };
  }

  get uid(): string {
    return `${IG}.${this.id}`;
  }

  toJSONValue(): InstagramPageValue {
    return { page: this.id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return InstagramPage.typeName;
  }
}

export default InstagramPage;
