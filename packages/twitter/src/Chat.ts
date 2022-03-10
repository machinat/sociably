import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TWITTER } from './constant';

type SerializedDmChat = {
  agentId: string;
  id: string;
};

export default class TwitterChat
  implements MachinatChannel, MarshallableInstance<SerializedDmChat>
{
  static typeName = 'TwitterChat';
  static fromJSONValue({ id, agentId }: SerializedDmChat): TwitterChat {
    return new TwitterChat(agentId, id);
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

  /** The unique id of the direct message channel */
  get uid(): string {
    return `twitter.${this.agentId}.${this.id}`;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterChat.typeName;
  }

  toJSONValue(): SerializedDmChat {
    return { id: this.id, agentId: this.agentId };
  }
}
