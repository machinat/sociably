import type { SociablyThread, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK, FB } from './constant';

type PageValue = {
  page: string;
};

class FacebookPage implements SociablyThread, MarshallableInstance<PageValue> {
  static typeName = 'FbPage';
  static fromJSONValue(value: PageValue): FacebookPage {
    const { page } = value;
    return new FacebookPage(page);
  }

  pageId: string;
  platform = FACEBOOK;

  constructor(pageId: string) {
    this.pageId = pageId;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: FACEBOOK,
      id: this.pageId,
    };
  }

  get uid(): string {
    return `${FB}.${this.pageId}`;
  }

  toJSONValue(): PageValue {
    return { page: this.pageId };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookPage.typeName;
  }
}

export default FacebookPage;
