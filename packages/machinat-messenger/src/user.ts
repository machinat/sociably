import type { MachinatUser } from '@machinat/core/types';
import { MESSENGER } from './constant';

export default class MessengerUser implements MachinatUser {
  platform = MESSENGER;
  pageId: string;
  psid: string;

  constructor(pageId: string | number, psid: string) {
    this.pageId = String(pageId);
    this.psid = psid;
  }

  get id(): string {
    return this.psid;
  }

  get uid(): string {
    return `messenger.${this.pageId}.${this.psid}`;
  }
}
