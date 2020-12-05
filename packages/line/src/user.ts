import type { MachinatUser } from '@machinat/core/types';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import { LINE } from './constant';

type LineUserValue = {
  providerId: string;
  id: string;
};

export default class LineUser
  implements MachinatUser, Marshallable<LineUserValue> {
  platform = LINE;
  providerId: string;
  id: string;

  static fromJSONValue({ providerId, id }: LineUserValue): LineUser {
    return new LineUser(providerId, id);
  }

  constructor(providerId: string, id: string) {
    this.providerId = providerId;
    this.id = id;
  }

  get uid(): string {
    return `line.${this.providerId}.${this.id}`;
  }

  toJSONValue(): LineUserValue {
    const { providerId, id } = this;
    return { providerId, id };
  }

  typeName(): string {
    return this.constructor.name;
  }
}
