import type { SociablyUser, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { TELEGRAM, TG } from './constant';
import UserProfile from './UserProfile';
import type { RawUser } from './types';

type TelegramUserValue = {
  id: number;
  isBot?: true;
};

class TelegramUser
  implements SociablyUser, MarshallableInstance<TelegramUserValue>
{
  static typeName = 'TgUser';
  static fromJSONValue({ id, isBot }: TelegramUserValue): TelegramUser {
    return new TelegramUser(id, isBot);
  }

  /** Id of the user or bot */
  id: number;
  data: null | RawUser;
  avatarUrl: undefined | string;

  platform = TELEGRAM;
  type = 'user' as const;
  private _isBot?: boolean;

  constructor(
    id: number,
    isBot?: boolean,
    rawData?: RawUser,
    avatarUrl?: string
  ) {
    this.id = id;
    this.data = rawData || null;
    this.avatarUrl = avatarUrl;
    this._isBot = isBot;
  }

  get isBot(): boolean {
    return this._isBot ?? this.data?.is_bot ?? false;
  }

  /** Profile of the user */
  get profile(): null | UserProfile {
    return this.data ? new UserProfile(this.data) : null;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: TELEGRAM,
      id: this.id,
    };
  }

  /** Unique id of the user */
  get uid(): string {
    return `${TG}.${this.id}`;
  }

  toJSONValue(): TelegramUserValue {
    return { id: this.id, isBot: this.isBot || undefined };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TelegramUser.typeName;
  }
}

export default TelegramUser;
