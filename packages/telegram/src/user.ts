/* eslint-disable camelcase */
import { MachinatUser } from '@machinat/core/types';
import { TELEGRAM } from './constant';
import { RawUser } from './types';

class TelegramUser implements MachinatUser {
  /** Unique identifier for this user or bot */
  id: number;
  /** True, if this user is a bot */
  isBot: boolean;
  /** User's or bot's first name */
  firstName: string;
  /** User's or bot's last name */
  lastName?: string;
  /** User's or bot's username */
  username?: string;
  /** IETF language tag of the user's language */
  languageCode?: string;

  platform = TELEGRAM;

  constructor(raw: RawUser) {
    this.id = raw.id;
    this.isBot = raw.is_bot;
    this.firstName = raw.first_name;
    this.lastName = raw.last_name;
    this.username = raw.username;
    this.languageCode = raw.language_code;
  }

  get uid(): string {
    return `telegram.${this.id}`;
  }
}

export default TelegramUser;
