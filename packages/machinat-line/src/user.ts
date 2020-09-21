import { MachinatUser } from '@machinat/core/types';
import { LINE } from './constant';

export default class LineUser implements MachinatUser {
  platform = LINE;
  providerId: string;
  id: string;

  constructor(providerId: string, id: string) {
    this.providerId = providerId;
    this.id = id;
  }

  get uid(): string {
    return `line.${this.providerId}.${this.id}`;
  }
}
