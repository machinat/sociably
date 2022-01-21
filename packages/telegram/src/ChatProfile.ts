import type { MachinatProfile } from '@machinat/core/base/Profiler';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TELEGRAM } from './constant';
import type { RawChat, TelegramChatType } from './types';

type TelegramChatProfileValue = {
  data: RawChat;
  avatar?: string;
};

class TelegramChatProfile
  implements MachinatProfile, MarshallableInstance<TelegramChatProfileValue>
{
  static typeName = 'TelegramChatProfile';
  static fromJSONValue(value: TelegramChatProfileValue): TelegramChatProfile {
    return new TelegramChatProfile(value.data, value.avatar);
  }

  data: RawChat;
  avatarUrl: undefined | string;
  platform = TELEGRAM;
  languageCode = undefined;
  timeZone = undefined;

  constructor(data: RawChat, avatarUrl?: string) {
    this.data = data;
    this.avatarUrl = avatarUrl;
  }

  get id(): number {
    return this.data.id;
  }

  get type(): TelegramChatType {
    return this.data.type;
  }

  get name(): string {
    const { title, first_name: firstName, last_name: lastName } = this.data;
    return (title ||
      (lastName ? `${firstName} ${lastName}` : firstName)) as string;
  }

  get title(): undefined | string {
    return this.data.title;
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

  toJSONValue(): TelegramChatProfileValue {
    const { data, avatarUrl } = this;
    return { data, avatar: avatarUrl };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TelegramChatProfile.typeName;
  }
}

export default TelegramChatProfile;
