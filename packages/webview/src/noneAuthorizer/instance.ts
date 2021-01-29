import type { Marshallable } from '@machinat/core/base/Marshaler';

class NoneInstance {
  id: string;
  platform = 'none';

  constructor(id: string) {
    this.id = id;
  }

  get uid(): string {
    return `none:${this.id}`;
  }

  toJSONValue(): { id: string } {
    return { id: this.id };
  }
}

/* eslint-disable class-methods-use-this */
export class NoneUser extends NoneInstance
  implements Marshallable<{ id: string }> {
  static fromJSONValue({ id }: { id: string }): NoneUser {
    return new NoneUser(id);
  }

  typeName(): string {
    return 'NoneUser';
  }
}

export class NoneChannel extends NoneInstance
  implements Marshallable<{ id: string }> {
  static fromJSONValue({ id }: { id: string }): NoneChannel {
    return new NoneChannel(id);
  }

  typeName(): string {
    return 'NoneChannel';
  }
}
