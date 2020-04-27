// @flow
import type { MachinatUser } from '@machinat/core/types';
import { LINE } from './constant';

export default class LineUser implements MachinatUser {
  platform = LINE;
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  get id() {
    return this.userId;
  }

  get uid() {
    return `line.*.${this.userId}`;
  }
}
