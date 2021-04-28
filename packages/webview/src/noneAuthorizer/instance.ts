import type { MarshallableInstance } from '@machinat/core/base/Marshaler';

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

export class NoneUser extends NoneInstance
  implements MarshallableInstance<{ id: string }> {
  static typeName = 'NoneUser';

  static fromJSONValue({ id }: { id: string }): NoneUser {
    return new NoneUser(id);
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return NoneUser.typeName;
  }
}

export class NoneChannel extends NoneInstance
  implements MarshallableInstance<{ id: string }> {
  static typeName = 'NoneChannel';

  static fromJSONValue({ id }: { id: string }): NoneChannel {
    return new NoneChannel(id);
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return NoneChannel.typeName;
  }
}
