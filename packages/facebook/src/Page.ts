import type { UniqueOmniIdentifier } from '@sociably/core';
import type { MessengerPage } from '@sociably/messenger';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK, FB } from './constant.js';

type FacebookPageValue = {
  page: string;
};

class FacebookPage
  implements MessengerPage, MarshallableInstance<FacebookPageValue>
{
  static typeName = 'FbPage';
  static fromJSONValue(value: FacebookPageValue): FacebookPage {
    const { page } = value;
    return new FacebookPage(page);
  }

  id: string;
  readonly platform = FACEBOOK;
  readonly $$typeofChannel = true;

  constructor(pageId: string) {
    this.id = pageId;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      $$typeof: ['channel'],
      platform: FACEBOOK,
      id: this.id,
    };
  }

  get uid(): string {
    return `${FB}.${this.id}`;
  }

  toJSONValue(): FacebookPageValue {
    return { page: this.id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookPage.typeName;
  }
}

export default FacebookPage;
