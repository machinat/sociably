import type {
  SociablyChannel,
  SociablyUser,
  SociablyThread,
} from '@sociably/core';
import type {
  BaseStateController,
  StateAccessor,
} from '@sociably/core/base/StateController';
import { makeClassProvider } from '@sociably/core/service';

export class InMemoryStateAccessor implements StateAccessor {
  _stateData: Map<string, unknown>;

  constructor(data: Map<string, unknown>) {
    this._stateData = data;
  }

  async get<T>(key: string): Promise<T> {
    return this._stateData.get(key) as T;
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    const isExisted = this._stateData.has(key);
    this._stateData.set(key, value);

    return isExisted;
  }

  update<T>(key: string, updator: (value: undefined | T) => T): Promise<T>;
  async update<T>(
    key: string,
    updator: (originalValue: undefined | T) => undefined | T
  ): Promise<undefined | T> {
    const originalValue = this._stateData.get(key) as undefined | T;
    const nextValue = updator(originalValue);

    if (nextValue !== undefined) {
      this._stateData.set(key, nextValue);
    } else {
      this._stateData.delete(key);
    }

    return nextValue;
  }

  async delete(key: string): Promise<boolean> {
    return this._stateData.delete(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this._stateData.keys());
  }

  async getAll<T>(): Promise<Map<string, T>> {
    return this._stateData as Map<string, T>;
  }

  async clear(): Promise<number> {
    const deletedCount = this._stateData.size;
    this._stateData.clear();
    return deletedCount;
  }
}

/**
 * @category Provider
 */
export class InMemoryStateController implements BaseStateController {
  private _channelStates: Map<string, Map<string, unknown>>;
  private _threadStates: Map<string, Map<string, unknown>>;
  private _userStates: Map<string, Map<string, unknown>>;
  private _globalStates: Map<string, Map<string, unknown>>;

  constructor() {
    this._channelStates = new Map();
    this._threadStates = new Map();
    this._userStates = new Map();
    this._globalStates = new Map();
  }

  channelState(channel: string | SociablyChannel): InMemoryStateAccessor {
    const channelUid = typeof channel === 'string' ? channel : channel.uid;

    const data = this._channelStates.get(channelUid);
    if (data) {
      return new InMemoryStateAccessor(data);
    }

    const newStateData = new Map();
    this._channelStates.set(channelUid, newStateData);

    return new InMemoryStateAccessor(newStateData);
  }

  threadState(thread: string | SociablyThread): InMemoryStateAccessor {
    const threadUid = typeof thread === 'string' ? thread : thread.uid;

    const data = this._threadStates.get(threadUid);
    if (data) {
      return new InMemoryStateAccessor(data);
    }

    const newStateData = new Map();
    this._threadStates.set(threadUid, newStateData);

    return new InMemoryStateAccessor(newStateData);
  }

  userState(user: string | SociablyUser): InMemoryStateAccessor {
    const userUid = typeof user === 'string' ? user : user.uid;

    const data = this._userStates.get(userUid);
    if (data) {
      return new InMemoryStateAccessor(data);
    }

    const newStateData = new Map();
    this._userStates.set(userUid, newStateData);

    return new InMemoryStateAccessor(newStateData);
  }

  globalState(name: string): InMemoryStateAccessor {
    const data = this._globalStates.get(name);
    if (data) {
      return new InMemoryStateAccessor(data);
    }

    const newStateData = new Map();
    this._globalStates.set(name, newStateData);

    return new InMemoryStateAccessor(newStateData);
  }
}

export const ControllerP = makeClassProvider({
  lifetime: 'singleton',
})(InMemoryStateController);

export type ControllerP = InMemoryStateController;
