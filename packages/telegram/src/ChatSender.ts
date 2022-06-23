import type { SociablyUser } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { TELEGRAM } from './constant';
import ChatProfile from './ChatProfile';
import type { TelegramChatType, RawChat } from './types';

type TelegramChatSenderValue = {
  type: TelegramChatType;
  id: number;
};

class TelegramChatSender
  implements SociablyUser, MarshallableInstance<TelegramChatSenderValue>
{
  static typeName = 'TelegramChatSender';
  static fromJSONValue(value: TelegramChatSenderValue): TelegramChatSender {
    const { type, id } = value;
    return new TelegramChatSender({ id, type });
  }

  platform = TELEGRAM;
  data: RawChat;

  constructor(data: RawChat) {
    this.data = data;
  }

  /** Id of the chat */
  get id(): number {
    return this.data.id;
  }

  /** Type of the chat */
  get type(): 'supergroup' | 'channel' {
    return this.data.type as 'supergroup' | 'channel';
  }

  /** Unique id of the chat sender user */
  get uid(): string {
    return `${TELEGRAM}.${this.id}`;
  }

  /** Profile of the chat */
  get profile(): null | ChatProfile {
    return this.data.title || this.data.username || this.data.first_name
      ? new ChatProfile(this.data)
      : null;
  }

  toJSONValue(): TelegramChatSenderValue {
    const { id, type } = this;
    return { id, type };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TelegramChatSender.typeName;
  }
}

export default TelegramChatSender;
