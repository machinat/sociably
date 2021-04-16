import type { MachinatChannel } from '@machinat/core';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import { TELEGRAM } from './constant';
import type { TelegramChatType, RawChat } from './types';
import TelegramUser from './user';

type TelegramChatValue = {
  botId: number;
  type: TelegramChatType;
  id: number;
};

export class TelegramChat
  implements MachinatChannel, Marshallable<TelegramChatValue> {
  static fromJSONValue(value: TelegramChatValue): TelegramChat {
    const { botId, type, id } = value;
    return new TelegramChat(botId, { id, type });
  }

  static fromUser(botId: number, user: TelegramUser): TelegramChat {
    const rawUser = user.data;
    return new TelegramChat(botId, {
      id: user.id,
      type: 'private',
      username: rawUser?.username,
      first_name: rawUser?.first_name,
      last_name: rawUser?.last_name,
    });
  }

  botId: number;
  data: RawChat;
  platform = TELEGRAM;

  constructor(botId: number, data: RawChat) {
    this.botId = botId;
    this.data = data;
  }

  /** Unique identifier for this chat. This number may be greater than 32 bits and some programming languages may have difficulty/silent defects in interpreting it. But it is smaller than 52 bits, so a signed 64 bit integer or double-precision float type are safe for storing this identifier. */
  get id(): number {
    return this.data.id;
  }

  /** Type of chat */
  get type(): TelegramChatType {
    return this.data.type;
  }

  get uid(): string {
    return `telegram.${this.botId}.${this.id}`;
  }

  toJSONValue(): TelegramChatValue {
    const { botId, id, type } = this;
    return { botId, id, type };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

type TelegramChatInstanceValue = {
  botId: number;
  id: string;
};

export class TelegramChatInstance
  implements MachinatChannel, Marshallable<TelegramChatInstanceValue> {
  static fromJSONValue(value: TelegramChatInstanceValue): TelegramChatInstance {
    return new TelegramChatInstance(value.botId, value.id);
  }

  botId: number;
  id: string;

  platform = TELEGRAM;
  type = 'chat_instance' as const;

  constructor(botId: number, id: string) {
    this.botId = botId;
    this.id = id;
  }

  get uid(): string {
    return `telegram.${this.botId}.${this.id}`;
  }

  toJSONValue(): TelegramChatInstanceValue {
    const { botId, id } = this;
    return { botId, id };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

type TelegramChatTargetValue = {
  botId: number;
  id: string | number;
};

export class TelegramChatTarget
  implements MachinatChannel, Marshallable<TelegramChatTargetValue> {
  static fromJSONValue(value: TelegramChatTargetValue): TelegramChatTarget {
    return new TelegramChatTarget(value.botId, value.id);
  }

  botId: number;
  id: string | number;

  platform = TELEGRAM;
  type = 'unknown' as const;

  constructor(botId: number, id: number | string) {
    this.botId = botId;
    this.id = id;
  }

  get uid(): string {
    return `telegram.${this.botId}.${this.id}`;
  }

  toJSONValue(): TelegramChatTargetValue {
    const { botId, id } = this;
    return { botId, id };
  }

  typeName(): string {
    return this.constructor.name;
  }
}
