import type { UniqueOmniIdentifier } from '@sociably/core';
import { MessengerChat } from '@sociably/messenger';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import InstagramAgent from './Agent.js';
import { INSTAGRAM, IG } from './constant.js';
import type { MessagingTarget } from './types.js';

type InstagramChatType = 'user' | 'comment' | 'unknown';

type ChatValue = {
  agent: string;
  target: MessagingTarget;
};

class InstagramChat implements MessengerChat, MarshallableInstance<ChatValue> {
  static typeName = 'IgChat';
  static fromJSONValue(value: ChatValue): InstagramChat {
    const { agent, target } = value;
    return new InstagramChat(agent, target);
  }

  agentId: string;
  target: MessagingTarget;

  readonly platform = INSTAGRAM;
  readonly $$typeofThread = true;

  constructor(agentId: string, target: MessagingTarget) {
    this.agentId = agentId;
    this.target = target;
  }

  get type(): InstagramChatType {
    const { target } = this;

    return 'id' in target
      ? 'user'
      : 'comment_id' in target
      ? 'comment'
      : 'unknown';
  }

  get id(): string {
    const target = this.target as Record<string, undefined | string>;
    return (
      target.id || target.user_ref || target.post_id || target.comment_id || '-'
    );
  }

  get agent(): InstagramAgent {
    return new InstagramAgent(this.agentId);
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: INSTAGRAM,
      scopeId: this.agentId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${IG}.${this.agentId}.${this.id}`;
  }

  toJSONValue(): ChatValue {
    const { agentId, target } = this;
    return { agent: agentId, target };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return InstagramChat.typeName;
  }
}

export default InstagramChat;
