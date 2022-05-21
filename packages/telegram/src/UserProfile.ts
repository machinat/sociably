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
  static typeName = 'TgUserProfile';
  static fromJSONValue(value: TelegramUserProfileValue): TelegramUserProfile {
    return new TelegramUserProfile(value.data, value.avatar);
  }

  avatarUrl: undefined | string;
  data: RawUser;
  platform = TELEGRAM;
  timeZone = undefined;
  type = 'user' as const;

  constructor(rawUser: RawUser, avatarUrl?: string) {
    this.avatarUrl = avatarUrl;
    this.data = rawUser;
  }

  /** Id of the user or bot */
  get id(): number {
    return this.data.id;
  }

  /** Display name of the user or bot */
  get name(): string {
    const { first_name: firstName, last_name: lastName } = this.data;
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  /** User's or bot's first name */
  get firstName(): undefined | string {
    return this.data.first_name;
  }

  /** User's or bot's last name */
  get lastName(): undefined | string {
    return this.data.last_name;
  }

  /** User's or bot's username */
  get username(): undefined | string {
    return this.data.username;
  }

  /** If this user is a bot */
  get isBot(): boolean {
    return this.data.is_bot;
  }

  /** IETF language tag of the user's language */
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
