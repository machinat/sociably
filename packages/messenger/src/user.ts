import type { MachinatUser } from '@machinat/core';
import type { CustomMarshallable } from '@machinat/core/base/Marshaler';
import { MESSENGER } from './constant';

type MessengerUserValue = {
  pageId: string;
  psid: string;
};

export default class MessengerUser
  implements MachinatUser, CustomMarshallable<MessengerUserValue> {
  static fromJSONValue(value: MessengerUserValue): MessengerUser {
    const { pageId, psid } = value;
    return new MessengerUser(pageId, psid);
  }

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

  toJSONValue(): MessengerUserValue {
    const { pageId, psid } = this;
    return { pageId, psid };
  }

  typeName(): string {
    return this.constructor.name;
  }
}
