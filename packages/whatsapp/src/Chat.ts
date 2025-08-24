import type { SociablyThread } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler.js';
import { WHATSAPP } from './constant.js';
import WhatsAppAgent from './Agent.js';
import WhatsAppUser from './User.js';

type WhatsAppChatValue = {
  agent: string;
  user: string;
};

class WhatsAppChat
  implements SociablyThread, MarshallableInstance<WhatsAppChatValue>
{
  static typeName = 'WhatsAppChat';
  static fromUser(agentNumberId: string, contact: WhatsAppUser): WhatsAppChat {
    return new WhatsAppChat(agentNumberId, contact.numberId);
  }

  static fromJSONValue(value: WhatsAppChatValue): WhatsAppChat {
    const { agent, user } = value;
    return new WhatsAppChat(agent, user);
  }

  agentNumberId: string;
  userNumberId: string;

  readonly platform = WHATSAPP;
  readonly $$typeofThread = true;

  constructor(agentNumberId: string, userNumberId: string) {
    this.agentNumberId = agentNumberId;
    this.userNumberId = userNumberId;
  }

  get uid(): string {
    return `${WHATSAPP}.${this.agentNumberId}.${this.userNumberId}`;
  }

  get agent(): WhatsAppAgent {
    return new WhatsAppAgent(this.agentNumberId);
  }

  get user(): WhatsAppUser {
    return new WhatsAppUser(this.userNumberId);
  }

  toJSONValue(): WhatsAppChatValue {
    const { agentNumberId, userNumberId } = this;
    return { agent: agentNumberId, user: userNumberId };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WhatsAppChat.typeName;
  }
}

export default WhatsAppChat;
