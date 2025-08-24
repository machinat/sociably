import type { SociablyThread } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler.js';
import TwitterUser from './User.js';
import { TWITTER } from './constant.js';

type SerializedChatValue = {
  agent: string;
  user: string;
};

export default class TwitterChat
  implements SociablyThread, MarshallableInstance<SerializedChatValue>
{
  static typeName = 'TwitterChat';
  static fromJSONValue({ agent, user }: SerializedChatValue): TwitterChat {
    return new TwitterChat(agent, user);
  }

  /** The id of the agent user */
  agentId: string;
  /** The id of the target user */
  userId: string;

  readonly platform = TWITTER;
  readonly $$typeofThread = true;

  constructor(agentId: string, userId: string) {
    this.agentId = agentId;
    this.userId = userId;
  }

  /** The unique id of the direct message thread */
  get uid(): string {
    return `${TWITTER}.${this.agentId}.${this.userId}`;
  }

  get agent(): TwitterUser {
    return new TwitterUser(this.agentId);
  }

  get user(): TwitterUser {
    return new TwitterUser(this.userId);
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterChat.typeName;
  }

  toJSONValue(): SerializedChatValue {
    return { user: this.userId, agent: this.agentId };
  }
}
