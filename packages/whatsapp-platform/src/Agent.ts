import type { SociablyChannel } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler.js';
import { WHATSAPP } from './constant.js';

type WhatsAppAgentValue = {
  id: string;
};

class WhatsAppAgent
  implements SociablyChannel, MarshallableInstance<WhatsAppAgentValue>
{
  static typeName = 'WhatsAppAgent';

  static fromJSONValue({ id }: WhatsAppAgentValue): WhatsAppAgent {
    return new WhatsAppAgent(id);
  }

  id: string;

  readonly platform = WHATSAPP;
  readonly $$typeofChannel = true;

  constructor(id: string) {
    this.id = id;
  }

  get uid(): string {
    return `${WHATSAPP}.${this.id}`;
  }

  toJSONValue(): WhatsAppAgentValue {
    return { id: this.id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WhatsAppAgent.typeName;
  }
}

export default WhatsAppAgent;
