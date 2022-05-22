import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { MESSENGER, FACEBOOK } from './constant';
import type MessengerUser from './User';
import type { PSIDTarget } from './types';

type FacebookChatValue = {
  page: string;
  id: string;
};

class FacebookChat
  implements MachinatChannel, MarshallableInstance<FacebookChatValue>
{
  static typeName = 'FacebookChat';
  static fromUser(user: MessengerUser): FacebookChat {
    return new FacebookChat(user.pageId, user.id);
  }

  static fromJSONValue(value: FacebookChatValue): FacebookChat {
    const { page, id } = value;
    return new FacebookChat(page, id);
  }

  pageId: string;
  id: string;
  platform = MESSENGER;
  type = 'psid';

  constructor(pageId: string, id: string) {
    this.pageId = pageId;
    this.id = id;
  }

  get uid(): string {
    return `${FACEBOOK}.${this.pageId}.${this.id}`;
  }

  get target(): PSIDTarget {
    return { id: this.id };
  }

  toJSONValue(): FacebookChatValue {
    const { pageId, id } = this;
    return { page: pageId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookChat.typeName;
  }
}

export default FacebookChat;
