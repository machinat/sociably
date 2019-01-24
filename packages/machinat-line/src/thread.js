// @flow
import type { MachinatThread } from 'machinat-base/types';
import type { LineSource } from './types';

export default class LineThread implements MachinatThread {
  type: string;
  source: LineSource;
  sourceId: string;

  platform = 'line';

  constructor(source: LineSource) {
    this.type = source.type;
    this.source = source;
    this.sourceId =
      source.type === 'group'
        ? source.groupId
        : source.type === 'room'
        ? source.roomId
        : source.userId;
  }

  uid() {
    return `line:${this.type}:${this.sourceId}`;
  }
}
