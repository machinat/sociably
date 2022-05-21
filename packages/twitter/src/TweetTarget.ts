import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TWITTER } from './constant';

type SerializedTweetTarget = {
  agent: string;
  tweet?: string;
};

export default class TwitterTweetTarget
  implements MachinatChannel, MarshallableInstance<SerializedTweetTarget>
{
  static typeName = 'TwtrTweetTarget';
  static fromJSONValue(val: SerializedTweetTarget): TwitterTweetTarget {
    return new TwitterTweetTarget(val.agent, val.tweet);
  }

  platform = TWITTER;
  /** The id of the agent user */
  agentId: string;
  /** The tweet to reply. If it's empty, the tweet is created under agent user's page  */
  tweetId?: string;

  constructor(agentId: string, tweetId?: string) {
    this.agentId = agentId;
    this.tweetId = tweetId;
  }

  get uid(): string {
    return `twtr.${this.agentId}.${this.tweetId || '-'}`;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterTweetTarget.typeName;
  }

  toJSONValue(): SerializedTweetTarget {
    return { agent: this.agentId, tweet: this.tweetId };
  }
}
