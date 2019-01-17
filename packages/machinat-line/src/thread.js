// @flow
import type { MachinatThread } from 'machinat-base/types';
import type { LineSource } from './types';

export default class LineThread implements MachinatThread {
  type: string;
  source: LineSource;

  platform = 'line';

  constructor(source: LineSource) {
    this.type = source.type;
    this.source = source;
  }

  uid() {
    const { source } = this;
    return `line:${this.type}:${
      source.type === 'group'
        ? source.groupId
        : source.type === 'room'
        ? source.roomId
        : source.userId
    }`;
  }
}
