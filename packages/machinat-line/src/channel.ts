import type { MachinatChannel } from '@machinat/core/types';
import { LINE } from './constant';
import LineUser from './user';
import type { LineSource } from './types';

type LineChatType = 'room' | 'group' | 'utou' | 'utob';

class LineChat implements MachinatChannel {
  static fromMessagingSource(
    providerId: string,
    botChannelId: string,
    source: LineSource
  ): LineChat {
    switch (source.type) {
      case 'user':
        return new LineChat(providerId, botChannelId, 'utob', source.userId);
      case 'room':
        return new LineChat(providerId, botChannelId, 'room', source.roomId);
      case 'group':
        return new LineChat(providerId, botChannelId, 'group', source.groupId);
      default:
        throw new Error(
          `unknown source "${(source as any).type || String(source)}"`
        );
    }
  }

  static fromUser(user: LineUser): LineChat {
    return new LineChat(user.providerId, user.botChannelId, 'utob', user.id);
  }

  platform = LINE;
  providerId: string;
  botChannelId: string;
  type: LineChatType;
  id: string;

  constructor(
    providerId: string,
    botChannelId: string,
    type: LineChatType,
    id: string
  ) {
    this.providerId = providerId;
    this.botChannelId = botChannelId;
    this.type = type;
    this.id = id;
  }

  get uid(): string {
    return `line.${this.providerId}.${
      this.type === 'utob' ? `${this.botChannelId}.` : ''
    }${this.id}`;
  }
}

export default LineChat;
