import type { MachinatUser } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { MESSENGER } from './constant';

type MessengerUserValue = {
  page: string;
  id: string;
};

export default class MessengerUser
  implements MachinatUser, MarshallableInstance<MessengerUserValue>
{
  static typeName = 'MessengerUser';

  static fromJSONValue(value: MessengerUserValue): MessengerUser {
    const { page, id } = value;
    return new MessengerUser(page, id);
  }

  platform = MESSENGER;
  pageId: string;
  id: string;

  constructor(pageId: string, id: string) {
    this.pageId = pageId;
    this.id = id;
  }

  get uid(): string {
    return `messenger.${this.pageId}.${this.id}`;
  }

  toJSONValue(): MessengerUserValue {
    const { pageId, id } = this;
    return { page: pageId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return MessengerUser.typeName;
  }
}
