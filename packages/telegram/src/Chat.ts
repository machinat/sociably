import type { SociablyThread, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { TELEGRAM, TG } from './constant.js';
import ChatProfile from './ChatProfile.js';
import type { TelegramChatType, RawChat, RawUser } from './types.js';

type TelegramChatValue = {
  bot: number;
  id: number | string;
};

class TelegramChat
  implements SociablyThread, MarshallableInstance<TelegramChatValue>
{
  static typeName = 'TgChat';

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

  readonly platform = TELEGRAM;
  readonly $$typeofThread = true;
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

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: TELEGRAM,
      scopeId: this.botId,
      id: this.id,
    };
  }

  /** Unique id of the chat thread */
  get uid(): string {
    return `${TG}.${this.botId}.${this.id}`;
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
