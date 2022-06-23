import type { SociablyChannel } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { TELEGRAM } from './constant';
import ChatProfile from './ChatProfile';
import type { TelegramChatType, RawChat, RawUser } from './types';

type TelegramChatValue = {
  bot: number;
  id: number | string;
};

class TelegramChat
  implements SociablyChannel, MarshallableInstance<TelegramChatValue>
{
  static typeName = 'TelegramChat';

  static fromJSONValue(value: TelegramChatValue): TelegramChat {
    const { bot, id } = value;
    return new TelegramChat(bot, id);
  }

  static fromUser(botId: number, data: RawUser): TelegramChat {
    return new TelegramChat(botId, data.id, {
      id: data.id,
      type: 'private',
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
    });
  }

  platform = TELEGRAM;
  botId: number;
  id: number | string;
  data: null | RawChat;

  constructor(botId: number, id: number | string, data?: RawChat) {
    this.botId = botId;
    this.id = id;
    this.data = data || null;
  }

  /** Type of chat */
  get type(): undefined | TelegramChatType {
    return this.data?.type;
  }

  /** Unique id of the chat channel */
  get uid(): string {
    return `${TELEGRAM}.${this.botId}.${this.id}`;
  }

  /** Profile of the chat */
  get profile(): null | ChatProfile {
    return this.data ? new ChatProfile(this.data) : null;
  }

  toJSONValue(): TelegramChatValue {
    const { botId, id } = this;
    return { bot: botId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TelegramChat.typeName;
  }
}

export default TelegramChat;
