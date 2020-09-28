import { MachinatChannel } from '@machinat/core/types';
import { TELEGRAM } from './constant';
import { TelegramChatType, RawChat } from './types';
import TelegramUser from './user';

export class TelegramChat implements MachinatChannel {
  static fromUser(botId: number, user: TelegramUser): TelegramChat {
    return new TelegramChat(botId, {
      id: user.id,
      type: 'private',
      username: user.username,
    });
  }

  private _raw: RawChat;
  botId: number;
  platform = TELEGRAM;

  constructor(botId: number, chat: RawChat) {
    this.botId = botId;
    this._raw = chat;
  }

  /** Unique identifier for this chat. This number may be greater than 32 bits and some programming languages may have difficulty/silent defects in interpreting it. But it is smaller than 52 bits, so a signed 64 bit integer or double-precision float type are safe for storing this identifier. */
  get id(): number {
    return this._raw.id;
  }

  /** Type of chat */
  get type(): TelegramChatType {
    return this._raw.type;
  }

  /** Title, for supergroups, channels and group chats */
  get title(): undefined | string {
    return this._raw.title;
  }

  /** Username, for private chats, supergroups and channels if available */
  get username(): undefined | string {
    return this._raw.username;
  }

  get uid(): string {
    return `telegram.${this.botId}.${this.id}`;
  }
}

export class TelegramChatInstance implements MachinatChannel {
  botId: number;
  _chatInstanceId: string;

  platform = TELEGRAM;
  type = 'chat_instance' as const;

  constructor(botId: number, chatInstance: string) {
    this.botId = botId;
    this._chatInstanceId = chatInstance;
  }

  get id(): string {
    return this._chatInstanceId;
  }

  get uid(): string {
    return `telegram.${this.botId}.${this._chatInstanceId}`;
  }
}

export class TelegramChatTarget implements MachinatChannel {
  botId: number;
  target: string | number;

  platform = TELEGRAM;
  type = 'unknown' as const;

  constructor(botId: number, target: number | string) {
    this.botId = botId;
    this.target = target;
  }

  get id(): string | number {
    return this.target;
  }

  get uid(): string {
    return `telegram.${this.botId}.${this.target}`;
  }
}
