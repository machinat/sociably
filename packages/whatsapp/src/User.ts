import type { SociablyUser, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import UserProfile from './UserProfile';
import { WHATSAPP, WA } from './constant';
import { UserProfileData } from './types';

type WhatsAppUserValue = {
  id: string;
};

class WhatsAppUser
  implements SociablyUser, MarshallableInstance<WhatsAppUserValue>
{
  static typeName = 'WaUser';

  static fromJSONValue({ id }: WhatsAppUserValue): WhatsAppUser {
    return new WhatsAppUser(id);
  }

  numberId: string;
  profileData?: UserProfileData;

  readonly platform = WHATSAPP;
  readonly $$typeofUser = true;

  constructor(numberId: string, profileData?: UserProfileData) {
    this.numberId = numberId;
    this.profileData = profileData;
  }

  get profile(): null | UserProfile {
    return this.profileData
      ? new UserProfile(this.numberId, this.profileData)
      : null;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      $$typeof: ['user'],
      platform: WHATSAPP,
      id: this.numberId,
    };
  }

  get uid(): string {
    return `${WA}.${this.numberId}`;
  }

  toJSONValue(): WhatsAppUserValue {
    return { id: this.numberId };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WhatsAppUser.typeName;
  }
}

export default WhatsAppUser;
