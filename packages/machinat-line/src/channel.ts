import type { MachinatChannel } from '@machinat/core/types';
import { LINE } from './constant';
import LineUser from './user';
import type { LineSource } from './types';

type LineChatType = 'room' | 'group' | 'utou' | 'utob';

class LineChat implements MachinatChannel {
  static fromMessagingSource(channelId: string, source: LineSource): LineChat {
    switch (source.type) {
      case 'user':
        return new LineChat(channelId, 'utob', source.userId);
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
}

export default LineChat;
