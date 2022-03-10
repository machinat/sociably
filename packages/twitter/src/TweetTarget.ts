import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TWITTER } from './constant';

type SerializedTweetTarget = {
  agentId: string;
  id: string;
};

export default class TwitterTweetTarget
  implements MachinatChannel, MarshallableInstance<SerializedTweetTarget>
{
  static typeName = 'TweetTarget';
  static fromJSONValue({
    agentId,
    id,
  }: SerializedTweetTarget): TwitterTweetTarget {
    return new TwitterTweetTarget(agentId, id);
  }

  platform = TWITTER;
  /** The id of the agent user */
  agentId: string;
  /** The id of the Tweet */
  id: string;
  constructor(agentId: string, tweetId: string) {
    this.agentId = agentId;
    this.id = tweetId;
  }

  get uid(): string {
    return `twitter.${this.agentId}.${this.id}`;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterTweetTarget.typeName;
  }

  toJSONValue(): SerializedTweetTarget {
    return { id: this.id, agentId: this.agentId };
  }
}
