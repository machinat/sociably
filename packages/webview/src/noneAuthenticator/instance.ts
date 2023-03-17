import type { UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';

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

export class NoneUser
  extends NoneInstance
  implements MarshallableInstance<{ id: string }>
{
  static typeName = 'NoneUser';

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: 'none',
      id: this.id,
    };
  }

  static fromJSONValue({ id }: { id: string }): NoneUser {
    return new NoneUser(id);
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return NoneUser.typeName;
  }
}

export class NoneThread
  extends NoneInstance
  implements MarshallableInstance<{ id: string }>
{
  static typeName = 'NoneThread';

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: 'none',
      id: this.id,
    };
  }

  static fromJSONValue({ id }: { id: string }): NoneThread {
    return new NoneThread(id);
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return NoneThread.typeName;
  }
}
