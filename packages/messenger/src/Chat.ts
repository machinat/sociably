import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { MESSENGER } from './constant';
import type MessengerUser from './User';
import type { PSIDTarget } from './types';

type MessengerChatValue = {
  page: string;
  id: string;
};

class MessengerChat
  implements MachinatChannel, MarshallableInstance<MessengerChatValue>
{
  static typeName = 'MessengerChat';
  static fromUser(user: MessengerUser): MessengerChat {
    return new MessengerChat(user.pageId, user.id);
  }

  static fromJSONValue(value: MessengerChatValue): MessengerChat {
    const { page, id } = value;
    return new MessengerChat(page, id);
  }

  pageId: string;
  id: string;
  platform = MESSENGER;
  type = 'id';

  constructor(pageId: string, id: string) {
    this.pageId = pageId;
    this.id = id;
  }

  get uid(): string {
    return `messenger.${this.pageId}.id.${this.id}`;
  }

  get target(): PSIDTarget {
    return { id: this.id };
  }

  toJSONValue(): MessengerChatValue {
    const { pageId, id } = this;
    return { page: pageId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return MessengerChat.typeName;
  }
}

export default MessengerChat;
