import { MachinatChannel } from '@machinat/core/types';
import { TELEGRAM } from './constant';
import { RawChat, TelegramChatType } from './types';

class TelegramChat implements MachinatChannel {
  chat: RawChat;
  platform = TELEGRAM;

  constructor(chat: RawChat) {
    this.chat = chat;
  }

  /** Unique identifier for this chat. This number may be greater than 32 bits and some programming languages may have difficulty/silent defects in interpreting it. But it is smaller than 52 bits, so a signed 64 bit integer or double-precision float type are safe for storing this identifier. */
  get id(): number {
    return this.chat.id;
  }

  /** Type of chat, can be either “private”, “group”, “supergroup” or “channel” */
  get type(): TelegramChatType {
    return this.chat.type;
  }

  /** Title, for supergroups, channels and group chats */
  get title(): undefined | string {
    return this.chat.title;
  }

  get uid(): string {
    return `telegram.${this.type}.${this.id}`;
  }
}

export default TelegramChat;
