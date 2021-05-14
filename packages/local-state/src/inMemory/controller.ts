import type { MachinatUser, MachinatChannel } from '@machinat/core';
import type {
  BaseStateController,
  StateAccessor,
} from '@machinat/core/base/StateController';
import { makeClassProvider } from '@machinat/core/service';

export class InMemoryStateAccessor implements StateAccessor {
  _stateData: Map<string, any>;

  constructor(data: Map<string, any>) {
    this._stateData = data;
  }

  async get<T>(key: string): Promise<T> {
    return this._stateData.get(key);
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    const isExisted = this._stateData.has(key);
    this._stateData.set(key, value);

    return isExisted;
  }

  async update<T>(
    key: string,
    updator: (originalValue: undefined | T) => undefined | T
  ): Promise<undefined | T> {
    const originalValue = this._stateData.get(key);
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

  async getAll<T>(): Promise<Map<string, T>> {
    return this._stateData;
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
  private _userStates: Map<string, Map<string, unknown>>;
  private _globalStates: Map<string, Map<string, unknown>>;

  constructor() {
    this._channelStates = new Map();
    this._userStates = new Map();
    this._globalStates = new Map();
  }

  channelState(channel: string | MachinatChannel): InMemoryStateAccessor {
    const channelUid = typeof channel === 'string' ? channel : channel.uid;

    const data = this._channelStates.get(channelUid);
    if (data) {
      return new InMemoryStateAccessor(data);
    }

    const newStateData = new Map();
    this._channelStates.set(channelUid, newStateData);

    return new InMemoryStateAccessor(newStateData);
  }

  userState(user: string | MachinatUser): InMemoryStateAccessor {
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
