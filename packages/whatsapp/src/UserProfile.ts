import type { SociablyProfile } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { WHATSAPP } from './constant.js';
import { UserProfileData } from './types.js';

type UserProfileValue = {
  num: string;
  data: UserProfileData;
};

class WhatsAppUserProfile
  implements SociablyProfile, MarshallableInstance<UserProfileValue>
{
  static typeName = 'WaUserProfile';

  static fromJSONValue({ num, data }: UserProfileValue): WhatsAppUserProfile {
    return new WhatsAppUserProfile(num, data);
  }

  platform = WHATSAPP;
  number: string;
  data: UserProfileData;
  firstName: undefined;
  lastName: undefined;
  avatarUrl: undefined;
  languageCode: undefined;
  timeZone: undefined;

  constructor(number: string, data: UserProfileData) {
    this.number = number;
    this.data = data;
  }

  get name(): string {
    return this.data.name;
  }

  toJSONValue(): UserProfileValue {
    return { num: this.number, data: this.data };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WhatsAppUserProfile.typeName;
  }
}

export default WhatsAppUserProfile;
