import type { SociablyChannel } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK } from './constant';

type FeedValue = {
  page: string;
};

class FacebookFeed implements SociablyChannel, MarshallableInstance<FeedValue> {
  static typeName = 'FacebookFeed';
  static fromJSONValue(value: FeedValue): FacebookFeed {
    const { page } = value;
    return new FacebookFeed(page);
  }

  pageId: string;
  platform = FACEBOOK;

  constructor(pageId: string) {
    this.pageId = pageId;
  }

  get uid(): string {
    return `${FACEBOOK}.${this.pageId}`;
  }

  toJSONValue(): FeedValue {
    return { page: this.pageId };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookFeed.typeName;
  }
}

export default FacebookFeed;
