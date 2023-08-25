import type { SociablyThread, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { LINE } from './constant.js';
import LineChannel from './Channel.js';
import type LineUser from './User.js';
import type { LineSource } from './types.js';

export type LineChatType = 'room' | 'group' | 'user';

type LineChatValue = {
  channel: string;
  type: LineChatType;
  id: string;
};

class LineChat implements SociablyThread, MarshallableInstance<LineChatValue> {
  static typeName = 'LineChat';

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

  static fromJSONValue({ channel, type, id }: LineChatValue): LineChat {
    return new LineChat(channel, type, id);
  }

  channelId: string;
  type: LineChatType;
  id: string;
  readonly platform = LINE;
  readonly $$typeofThread = true;

  constructor(channelId: string, type: LineChatType, id: string) {
    this.channelId = channelId;
    this.type = type;
    this.id = id;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: LINE,
      scopeId: this.channelId,
      id: this.id,
    };
  }

  get uid(): string {
    return `line.${this.channelId}.${this.id}`;
  }

  get channel(): LineChannel {
    return new LineChannel(this.channelId);
  }

  get agent(): LineChannel {
    return this.channel;
  }

  toJSONValue(): LineChatValue {
    const { type, channelId, id } = this;
    return { type, channel: channelId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return LineChat.name;
  }
}

export default LineChat;
