import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TWITTER } from './constant';

type SerializedTweetTarget = {
  id: string;
};

export default class TwitterTweetTarget
  implements MachinatChannel, MarshallableInstance<SerializedTweetTarget>
{
  static typeName = 'TweetTarget';
  static fromJSONValue({ id }: SerializedTweetTarget): TwitterTweetTarget {
    return new TwitterTweetTarget(id);
  }

  platform = TWITTER;
  /** The unique identifier for this Tweet */
  id: string;
  constructor(statusId: string) {
    this.id = statusId;
  }

  get uid(): string {
    return `twitter.tweet.${this.id}`;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterTweetTarget.typeName;
  }

  toJSONValue(): SerializedTweetTarget {
    return { id: this.id };
  }
}
