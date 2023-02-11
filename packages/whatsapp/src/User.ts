import type { SociablyUser, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { WHATSAPP, WA } from './constant';
import type WhatsAppChat from './Chat';
import UserProfile from './UserProfile';
import { UserProfileData } from './types';

type WhatsAppUserValue = {
  num: string;
};

class WhatsAppUser
  implements SociablyUser, MarshallableInstance<WhatsAppUserValue>
{
  static typeName = 'WaUser';
  static fromChat(chat: WhatsAppChat): WhatsAppUser {
    return new WhatsAppUser(chat.customerNumber);
  }

  static fromJSONValue({ num }: WhatsAppUserValue): WhatsAppUser {
    return new WhatsAppUser(num);
  }

  platform = WHATSAPP;
  number: string;
  profileData?: UserProfileData;

  constructor(number: string, profileData?: UserProfileData) {
    this.number = number;
    this.profileData = profileData;
  }

  get profile(): null | UserProfile {
    return this.profileData
      ? new UserProfile(this.number, this.profileData)
      : null;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: WHATSAPP,
      id: this.number,
    };
  }

  get uid(): string {
    return `${WA}.${this.number}`;
  }

  toJSONValue(): WhatsAppUserValue {
    return { num: this.number };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WhatsAppUser.typeName;
  }
}

export default WhatsAppUser;
