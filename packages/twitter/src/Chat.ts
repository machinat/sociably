import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TWITTER } from './constant';

type SerializedDmChat = {
  id: string;
};

export default class TwitterChat
  implements MachinatChannel, MarshallableInstance<SerializedDmChat>
{
  static typeName = 'TwitterChat';
  static fromJSONValue({ id }: SerializedDmChat): TwitterChat {
    return new TwitterChat(id);
  }

  platform = TWITTER;
  /** The unique identifier for this Tweet */
  id: string;
  constructor(userId: string) {
    this.id = userId;
  }

  get uid(): string {
    return `twitter.dm_user.${this.id}`;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterChat.typeName;
  }

  toJSONValue(): SerializedDmChat {
    return { id: this.id };
  }
}
