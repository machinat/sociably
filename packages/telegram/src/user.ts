import type { MachinatUser } from '@machinat/core/types';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import { TELEGRAM } from './constant';
import type { RawUser } from './types';

type TelegramUserValue = {
  id: number;
};

class TelegramUser implements MachinatUser, Marshallable<TelegramUserValue> {
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

  typeName(): string {
    return this.constructor.name;
  }
}

export default TelegramUser;
