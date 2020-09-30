import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import type {
  BaseStateController,
  StateAccessor,
} from '@machinat/core/base/StateControllerI';
import { provider } from '@machinat/core/service';

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
  ): Promise<boolean> {
    const originalValue = this._stateData.get(key);

    const isExisted = originalValue !== undefined;
    const nextValue = updator(originalValue);

    if (nextValue !== undefined) {
      this._stateData.set(key, nextValue);
    } else {
      this._stateData.delete(key);
    }
    return isExisted;
  }

  async delete(key: string): Promise<boolean> {
    return this._stateData.delete(key);
  }

  async getAll(): Promise<Map<string, any>> {
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
  private _channelStates: Map<string, Map<string, any>>;
  private _userStates: Map<string, Map<string, any>>;
  private _globalStates: Map<string, Map<string, any>>;

  constructor() {
    this._channelStates = new Map();
    this._userStates = new Map();
    this._globalStates = new Map();
  }

  channelState(channel: MachinatChannel): InMemoryStateAccessor {
    const data = this._channelStates.get(channel.uid);
    if (data) {
      return new InMemoryStateAccessor(data);
    }

    const newStateData = new Map();
    this._channelStates.set(channel.uid, newStateData);

    return new InMemoryStateAccessor(newStateData);
  }

  userState(user: MachinatUser): InMemoryStateAccessor {
    const data = this._channelStates.get(user.uid);
    if (data) {
      return new InMemoryStateAccessor(data);
    }

    const newStateData = new Map();
    this._userStates.set(user.uid, newStateData);

    return new InMemoryStateAccessor(newStateData);
  }

  globalState(name: string): InMemoryStateAccessor {
    const data = this._channelStates.get(name);
    if (data) {
      return new InMemoryStateAccessor(data);
    }

    const newStateData = new Map();
    this._globalStates.set(name, newStateData);

    return new InMemoryStateAccessor(newStateData);
  }
}

export const ControllerP = provider<InMemoryStateController>({
  lifetime: 'singleton',
})(InMemoryStateController);

export type ControllerP = InMemoryStateController;
