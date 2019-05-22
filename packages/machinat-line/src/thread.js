// @flow
import type { MachinatThread } from 'machinat-base/types';
import type { LineSource } from './types';

class LineThread implements MachinatThread {
  platform = 'line';
  type = 'chat';

  subtype: 'user' | 'room' | 'group';
  uid: string;
  source: LineSource;
  sourceId: string;

  constructor(source: LineSource) {
    this.subtype = source.type;

    this.source = source;
    this.sourceId =
      source.type === 'group'
        ? source.groupId
        : source.type === 'room'
        ? source.roomId
        : source.userId;

    this.uid = `line:default:${this.subtype}:${this.sourceId}`;
  }
}

export default LineThread;
