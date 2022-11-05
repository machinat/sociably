import type { SociablyChannel } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK } from './constant';

type PageFeedValue = {
  page: string;
};

class FacebookPageFeed
  implements SociablyChannel, MarshallableInstance<PageFeedValue>
{
  static typeName = 'FacebookPageFeed';
  static fromJSONValue(value: PageFeedValue): FacebookPageFeed {
    const { page } = value;
    return new FacebookPageFeed(page);
  }

  pageId: string;
  platform = FACEBOOK;

  constructor(pageId: string) {
    this.pageId = pageId;
  }

  get uid(): string {
    return `${FACEBOOK}.${this.pageId}`;
  }

  toJSONValue(): PageFeedValue {
    return { page: this.pageId };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookPageFeed.typeName;
  }
}

export default FacebookPageFeed;
