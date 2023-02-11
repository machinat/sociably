import type { SociablyChannel, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { TWITTER, TWTR } from './constant';

type SerializedDmChat = {
  agent: string;
  id: string;
};

export default class TwitterChat
  implements SociablyChannel, MarshallableInstance<SerializedDmChat>
{
  static typeName = 'TwtrChat';
  static fromJSONValue({ id, agent }: SerializedDmChat): TwitterChat {
    return new TwitterChat(agent, id);
  }

  platform = TWITTER;
  /** The id of the agent user */
  agentId: string;
  /** The id of the target user */
  id: string;
  constructor(agentId: string, userId: string) {
    this.agentId = agentId;
    this.id = userId;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: TWITTER,
      scopeId: this.agentId,
      id: this.id,
    };
  }

  /** The unique id of the direct message channel */
  get uid(): string {
    return `${TWTR}.${this.agentId}.${this.id}`;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterChat.typeName;
  }

  toJSONValue(): SerializedDmChat {
    return { id: this.id, agent: this.agentId };
  }
}
