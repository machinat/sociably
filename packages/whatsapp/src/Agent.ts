import type { SociablyChannel, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { WHATSAPP, WA } from './constant.js';

type WhatsAppAgentValue = {
  id: string;
};

class WhatsAppAgent
  implements SociablyChannel, MarshallableInstance<WhatsAppAgentValue>
{
  static typeName = 'WaAgent';

  static fromJSONValue({ id }: WhatsAppAgentValue): WhatsAppAgent {
    return new WhatsAppAgent(id);
  }

  numberId: string;

  readonly platform = WHATSAPP;
  readonly $$typeofChannel = true;

  constructor(numberId: string) {
    this.numberId = numberId;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      $$typeof: ['channel'],
      platform: WHATSAPP,
      id: this.numberId,
    };
  }

  get uid(): string {
    return `${WA}.${this.numberId}`;
  }

  toJSONValue(): WhatsAppAgentValue {
    return { id: this.numberId };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WhatsAppAgent.typeName;
  }
}

export default WhatsAppAgent;
