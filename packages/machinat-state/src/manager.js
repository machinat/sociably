// @flow
import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import { provider } from '@machinat/core/service';
import { StateRepositoryI } from './interface';

class StateAccessor {
  _repository: StateRepositoryI;
  name: string;

  constructor(repository: StateRepositoryI, name: string) {
    this._repository = repository;
    this.name = name;
  }

  async get<T>(key: string): Promise<null | T> {
    return this._repository.get(this.name, key);
  }

  async set<T>(
    key: string,
    updator: (state: null | T) => null | T
  ): Promise<boolean> {
    const state = await this._repository.get(this.name, key);
    return this._repository.set(this.name, key, updator(state));
  }

  async delete(key: string): Promise<boolean> {
    return this._repository.delete(this.name, key);
  }

  async getAll(): Promise<null | Map<string, Object>> {
    return this._repository.getAll(this.name);
  }

  async clear(): Promise<void | number> {
    return this._repository.clear(this.name);
  }
}

class StateManager {
  repository: StateRepositoryI;

  constructor(repository: StateRepositoryI) {
    this.repository = repository;
  }

  channelState(channel: MachinatChannel): StateAccessor {
    return new StateAccessor(this.repository, `chan:${channel.uid}`);
  }

  userState(user: MachinatUser): StateAccessor {
    return new StateAccessor(this.repository, `user:${user.uid}`);
  }

  namedState(name: string): StateAccessor {
    return new StateAccessor(this.repository, name);
  }
}

export default provider<StateManager>({
  lifetime: 'scoped',
  deps: [StateRepositoryI],
})(StateManager);
