import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TELEGRAM } from './constant';
import ChatProfile from './ChatProfile';
import type TelegramUser from './User';
import type { TelegramChatType, RawChat } from './types';

type TelegramChatValue = {
  botId: number;
  type: TelegramChatType;
  id: number;
};

class TelegramChat
  implements MachinatChannel, MarshallableInstance<TelegramChatValue>
{
  static typeName = 'TelegramChat';

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

  platform = TELEGRAM;
  botId: number;
  data: RawChat;

  constructor(botId: number, data: RawChat) {
    this.botId = botId;
    this.data = data;
  }

  /** Id of the chat */
  get id(): number {
    return this.data.id;
  }

  /** Type of chat */
  get type(): TelegramChatType {
    return this.data.type;
  }

  /** Unique id of the chat channel */
  get uid(): string {
    return `telegram.${this.botId}.${this.id}`;
  }

  /** Profile of the chat */
  get profile(): null | ChatProfile {
    return this.data.title || this.data.username || this.data.first_name
      ? new ChatProfile(this.data)
      : null;
  }

  toJSONValue(): TelegramChatValue {
    const { botId, id, type } = this;
    return { botId, id, type };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TelegramChat.typeName;
  }
}

export default TelegramChat;
