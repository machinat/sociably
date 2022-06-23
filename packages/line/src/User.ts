import type { SociablyUser } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { LINE } from './constant';

type LineUserValue = {
  provider: string;
  id: string;
};

export default class LineUser
  implements SociablyUser, MarshallableInstance<LineUserValue>
{
  static typeName = 'LineUser';

  platform = LINE;
  providerId: string;
  id: string;

  static fromJSONValue({ provider, id }: LineUserValue): LineUser {
    return new LineUser(provider, id);
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
    return { provider: providerId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return LineUser.typeName;
  }
}
