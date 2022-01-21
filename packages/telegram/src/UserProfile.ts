import type { MachinatProfile } from '@machinat/core/base/Profiler';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TELEGRAM } from './constant';
import type { RawUser } from './types';

type TelegramUserProfileValue = {
  data: RawUser;
  avatar?: string;
};

class TelegramUserProfile
  implements MachinatProfile, MarshallableInstance<TelegramUserProfileValue>
{
  static typeName = 'TelegramUserProfile';
  static fromJSONValue(value: TelegramUserProfileValue): TelegramUserProfile {
    return new TelegramUserProfile(value.data, value.avatar);
  }

  avatarUrl: undefined | string;
  data: RawUser;
  platform = TELEGRAM;
  timeZone = undefined;

  constructor(rawUser: RawUser, avatarUrl?: string) {
    this.avatarUrl = avatarUrl;
    this.data = rawUser;
  }

  get id(): number {
    return this.data.id;
  }

  get name(): string {
    const { first_name: firstName, last_name: lastName } = this.data;
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  get firstName(): undefined | string {
    return this.data.first_name;
  }

  get lastName(): undefined | string {
    return this.data.last_name;
  }

  get username(): undefined | string {
    return this.data.username;
  }

  get isBot(): boolean {
    return this.data.is_bot;
  }

  get languageCode(): undefined | string {
    return this.data.language_code;
  }

  toJSONValue(): TelegramUserProfileValue {
    const { data, avatarUrl } = this;
    return { data, avatar: avatarUrl };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TelegramUserProfile.typeName;
  }
}

export default TelegramUserProfile;
