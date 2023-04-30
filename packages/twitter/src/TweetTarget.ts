import type { SociablyThread, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import TwitterUser from './User';
import { TWITTER, TWTR } from './constant';

type SerializedTweetTarget = {
  agent: string;
  tweet?: string;
};

const DEFAULT_FEED_SIGN = '-';

export default class TwitterTweetTarget
  implements SociablyThread, MarshallableInstance<SerializedTweetTarget>
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

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: TWITTER,
      scopeId: this.agentId,
      id: this.tweetId || DEFAULT_FEED_SIGN,
    };
  }

  get uid(): string {
    return `${TWTR}.${this.agentId}.${this.tweetId || DEFAULT_FEED_SIGN}`;
  }

  get agent(): TwitterUser {
    return new TwitterUser(this.agentId);
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterTweetTarget.typeName;
  }

  toJSONValue(): SerializedTweetTarget {
    return { agent: this.agentId, tweet: this.tweetId };
  }
}
