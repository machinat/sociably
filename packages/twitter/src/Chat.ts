import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TWITTER } from './constant';

type SerializedDmChat = {
  agent: string;
  id: string;
};

export default class TwitterChat
  implements MachinatChannel, MarshallableInstance<SerializedDmChat>
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

  /** The unique id of the direct message channel */
  get uid(): string {
    return `twtr.${this.agentId}.${this.id}`;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterChat.typeName;
  }

  toJSONValue(): SerializedDmChat {
    return { id: this.id, agent: this.agentId };
  }
}
