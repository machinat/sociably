import type { SociablyUser } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { TELEGRAM } from './constant';
import UserProfile from './UserProfile';
import type { RawUser } from './types';

type TelegramUserValue = {
  id: number;
};

class TelegramUser
  implements SociablyUser, MarshallableInstance<TelegramUserValue>
{
  static typeName = 'TelegramUser';
  static fromJSONValue({ id }: TelegramUserValue): TelegramUser {
    return new TelegramUser(id);
  }

  /** Id of the user or bot */
  id: number;
  data: null | RawUser;
  avatarUrl: undefined | string;

  platform = TELEGRAM;
  type = 'user' as const;

  constructor(id: number, rawData?: RawUser, avatarUrl?: string) {
    this.id = id;
    this.data = rawData || null;
    this.avatarUrl = avatarUrl;
  }

  /** Unique id of the user */
  get uid(): string {
    return `${TELEGRAM}.${this.id}`;
  }

  /** Profile of the user */
  get profile(): null | UserProfile {
    return this.data ? new UserProfile(this.data) : null;
  }

  toJSONValue(): TelegramUserValue {
    return { id: this.id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TelegramUser.typeName;
  }
}

export default TelegramUser;
