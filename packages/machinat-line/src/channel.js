// @flow
import invariant from 'invariant';
import type { MachinatChannel } from '@machinat/core/types';
import { LINE } from './constant';
import type { LineSource, LIFFContext } from './types';

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

  static fromLIFFContext(
    providerId: string,
    botChannelId: string,
    context: LIFFContext,
    isOnBotChannel: boolean = false
  ): null | LineChannel {
    if (isOnBotChannel) {
      invariant(
        context.type === 'utou',
        `cannot create an utob channel from a "${context.type}" context`
      );
      return new LineChannel(providerId, botChannelId, 'utob', context.userId);
    }

    switch (context.type) {
      case 'utou':
        return new LineChannel(
          providerId,
          botChannelId || '*',
          'utou',
          (context.utouId: any)
        );
      case 'room':
        return new LineChannel(
          providerId,
          botChannelId || '*',
          'room',
          (context.roomId: any)
        );
      case 'group':
        return new LineChannel(
          providerId,
          botChannelId || '*',
          'group',
          (context.groupId: any)
        );
      default:
        return null;
    }
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
