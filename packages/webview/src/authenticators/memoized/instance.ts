import type { MarshallableInstance } from '@sociably/core/base/Marshaler';

class MemoizedInstance {
  id: string;
  platform = 'memoized';

  constructor(id: string) {
    this.id = id;
  }

  get uid(): string {
    return `memoized:${this.id}`;
  }

  get uniqueIdentifier() {
    return {
      platform: 'memoized',
      id: this.id,
    };
  }

  toJSONValue(): { id: string } {
    return { id: this.id };
  }
}

export class MemoizedUser
  extends MemoizedInstance
  implements MarshallableInstance<{ id: string }>
{
  static typeName = 'MemoizedUser';

  static fromJSONValue({ id }: { id: string }): MemoizedUser {
    return new MemoizedUser(id);
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return MemoizedUser.typeName;
  }
}

export class MemoizedThread
  extends MemoizedInstance
  implements MarshallableInstance<{ id: string }>
{
  static typeName = 'MemoizedThread';

  static fromJSONValue({ id }: { id: string }): MemoizedThread {
    return new MemoizedThread(id);
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return MemoizedThread.typeName;
  }
}
