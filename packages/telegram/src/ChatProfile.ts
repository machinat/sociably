import type { SociablyProfile } from '@sociably/core/base/Profiler';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { TELEGRAM } from './constant.js';
import type { RawChat, TelegramChatType } from './types.js';

type TelegramChatProfileValue = {
  data: RawChat;
  avatar?: string;
};

class TelegramChatProfile
  implements SociablyProfile, MarshallableInstance<TelegramChatProfileValue>
{
  static typeName = 'TgChatProfile';
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

  /** Id of the chat */
  get id(): number {
    return this.data.id;
  }

  /** Type of chat */
  get type(): TelegramChatType {
    return this.data.type;
  }

  /** Display name of the chat */
  get name(): string {
    const { title, first_name: firstName, last_name: lastName } = this.data;
    return title || (lastName ? `${firstName} ${lastName}` : firstName)!;
  }

  /** Title, for supergroups, channels and group chats */
  get title(): undefined | string {
    return this.data.title;
  }

  /** First name of the other party in a private chat */
  get firstName(): undefined | string {
    return this.data.first_name;
  }

  /** Last name of the other party in a private chat */
  get lastName(): undefined | string {
    return this.data.last_name;
  }

  /** Username, for private chats, supergroups and channels if available */
  get username(): undefined | string {
    return this.data.username;
  }

  /** Bio of the other party in a private chat */
  get bio(): undefined | string {
    return this.data.bio;
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
