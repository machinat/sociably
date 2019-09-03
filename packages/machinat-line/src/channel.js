// @flow
import type { MachinatChannel } from 'machinat/types';
import type { LineSource } from './types';
import { LINE } from './constant';

class LineChannel implements MachinatChannel {
  platform = LINE;
  type = 'chat';

  subtype: 'user' | 'room' | 'group';
  uid: string;
  source: LineSource;
  sourceId: string;

  constructor(source: LineSource, lineChannelId: string) {
    this.subtype = source.type;

    this.source = source;
    this.sourceId =
      source.type === 'group'
        ? source.groupId
        : source.type === 'room'
        ? source.roomId
        : source.userId;

    this.uid = `line:${lineChannelId}:${this.subtype}:${this.sourceId}`;
  }
}

export default LineChannel;
