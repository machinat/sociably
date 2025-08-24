import type { MarshallableInstance } from '@sociably/core/base/Marshaler.js';
import { MetaApiChannel } from '@sociably/meta-api';
import { FACEBOOK } from './constant.js';

type FacebookPageValue = {
  page: string;
};

class FacebookPage
  implements MetaApiChannel, MarshallableInstance<FacebookPageValue>
{
  static typeName = 'FacebookPage';
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

  get uid(): string {
    return `${FACEBOOK}.${this.id}`;
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
