// @flow
import type { MachinatChannel } from '@machinat/core/types';
import { LINE } from './constant';
import type LineUser from './user';
import type { LineSource } from './types';

type LineChannelType = 'room' | 'group' | 'utou' | 'utob';

class LineChannel implements MachinatChannel {
  static fromMessagingSource(
    providerId: string,
    botChannelId: string,
    source: LineSource
  ): LineChannel {
    switch (source.type) {
      case 'user':
        return new LineChannel(providerId, botChannelId, 'utob', source.userId);
      case 'room':
        return new LineChannel(providerId, botChannelId, 'room', source.roomId);
      case 'group':
        return new LineChannel(
          providerId,
          botChannelId,
          'group',
          source.groupId
        );
      default:
        throw new Error(`unknown source type "${source.type}"`);
    }
  }

  static fromUser(user: LineUser) {
    return new LineChannel(user.providerId, user.botChannelId, 'utob', user.id);
  }

  platform = LINE;
  providerId: string;
  botChannelId: string;
  type: LineChannelType;
  id: string;

  constructor(
    providerId: string,
    botChannelId: string,
    type: LineChannelType,
    id: string
  ) {
    this.providerId = providerId;
    this.botChannelId = botChannelId;
    this.type = type;
    this.id = id;
  }

  get uid() {
    return `line.${this.providerId}.${
      this.type === 'utob' ? `${this.botChannelId}.` : ''
    }${this.id}`;
  }
}

export default LineChannel;
