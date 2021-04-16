import type { MachinatChannel } from '@machinat/core';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import { LINE } from './constant';
import type LineUser from './user';
import type { LineSource } from './types';

type LineChatType = 'room' | 'group' | 'user';

type LineChatValue = {
  channelId: string;
  type: LineChatType;
  id: string;
};

class LineChat implements MachinatChannel, Marshallable<LineChatValue> {
  static fromUser(channelId: string, user: LineUser): LineChat {
    return new LineChat(channelId, 'user', user.id);
  }

  static fromMessagingSource(channelId: string, source: LineSource): LineChat {
    switch (source.type) {
      case 'user':
        return new LineChat(channelId, 'user', source.userId);
      case 'room':
        return new LineChat(channelId, 'room', source.roomId);
      case 'group':
        return new LineChat(channelId, 'group', source.groupId);
      default:
        throw new Error(
          `unknown source "${(source as any).type || String(source)}"`
        );
    }
  }

  static fromJSONValue({ channelId, type, id }: LineChatValue): LineChat {
    return new LineChat(channelId, type, id);
  }

  platform = LINE;
  channelId: string;
  type: LineChatType;
  id: string;

  constructor(channelId: string, type: LineChatType, id: string) {
    this.channelId = channelId;
    this.type = type;
    this.id = id;
  }

  get uid(): string {
    return `line.${this.channelId}.${this.id}`;
  }

  toJSONValue(): LineChatValue {
    const { type, channelId, id } = this;
    return { type, channelId, id };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

export default LineChat;
