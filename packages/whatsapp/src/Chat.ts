import type { SociablyChannel } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { WHATSAPP } from './constant';
import type WhatsAppUser from './User';

type WhatsAppChatValue = {
  business: string;
  customer: string;
};

class WhatsAppChat
  implements SociablyChannel, MarshallableInstance<WhatsAppChatValue>
{
  static typeName = 'WhatsAppChat';
  static fromUser(accountId: string, user: WhatsAppUser): WhatsAppChat {
    return new WhatsAppChat(accountId, user.number);
  }

  static fromJSONValue(value: WhatsAppChatValue): WhatsAppChat {
    const { business, customer } = value;
    return new WhatsAppChat(business, customer);
  }

  businessNumber: string;
  customerNumber: string;
  platform = WHATSAPP;

  constructor(businessNumber: string, customerNumber: string) {
    this.businessNumber = businessNumber;
    this.customerNumber = customerNumber;
  }

  get uid(): string {
    return `${WHATSAPP}.${this.businessNumber}.${this.customerNumber}`;
  }

  toJSONValue(): WhatsAppChatValue {
    const { businessNumber, customerNumber } = this;
    return { business: businessNumber, customer: customerNumber };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WhatsAppChat.typeName;
  }
}

export default WhatsAppChat;
