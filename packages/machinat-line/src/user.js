// @flow
import type { MachinatUser } from '@machinat/core/types';
import { LINE } from './constant';

export default class LineUser implements MachinatUser {
  platform = LINE;
  providerId: string;
  botChannelId: string;
  id: string;

  constructor(providerId: string, botChannelId: string, id: string) {
    this.providerId = providerId;
    this.botChannelId = botChannelId;
    this.id = id;
  }

  get uid() {
    return `line.${this.providerId}.${this.id}`;
  }
}
