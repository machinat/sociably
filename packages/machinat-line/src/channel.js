// @flow
import type { MachinatChannel } from 'machinat/types';
import type { LineSource } from './types';
import { LINE } from './constant';

class LineChannel implements MachinatChannel {
  platform = LINE;
  channelId: string;
  type: 'user' | 'room' | 'group';
  source: LineSource;
  sourceId: string;

  constructor(lineChannelId: string, source: LineSource) {
    this.channelId = lineChannelId;
    this.type = source.type;

    this.source = source;
    this.sourceId =
      source.type === 'group'
        ? source.groupId
        : source.type === 'room'
        ? source.roomId
        : source.userId;
  }

  get uid() {
    return `line:${this.channelId}:${this.type}:${this.sourceId}`;
  }
}

export default LineChannel;
