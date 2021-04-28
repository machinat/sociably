import type { MachinatUser } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TELEGRAM } from './constant';
import type { RawUser } from './types';

type TelegramUserValue = {
  id: number;
};

class TelegramUser
  implements MachinatUser, MarshallableInstance<TelegramUserValue> {
  static typeName = 'TelegramUser';

  static fromJSONValue({ id }: TelegramUserValue): TelegramUser {
    return new TelegramUser(id);
  }

  /** Unique identifier for this user or bot */
  id: number;
  data: null | RawUser;

  platform = TELEGRAM;

  constructor(id: number, raw?: RawUser) {
    this.id = id;
    this.data = raw || null;
  }

  get uid(): string {
    return `telegram.${this.id}`;
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
