import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import type Base from '@machinat/core/base';
import { provider } from '@machinat/core/service';
import { StateRepository, StateRepositoryI } from './interface';

class StateAccessor {
  _repository: StateRepository;
  name: string;

  constructor(repository: StateRepository, name: string) {
    this._repository = repository;
    this.name = name;
  }

  async get<T>(key: string): Promise<void | T> {
    return this._repository.get(this.name, key);
  }

  async set<T>(
    key: string,
    updator: (state: void | T) => void | T
  ): Promise<boolean> {
    const state = await this._repository.get<T>(this.name, key);
    const updated = updator(state);

    if (updated === undefined) {
      return this._repository.delete(this.name, key);
    }

    return this._repository.set(this.name, key, updated);
  }

  async delete(key: string): Promise<boolean> {
    return this._repository.delete(this.name, key);
  }

  async getAll(): Promise<null | Map<string, any>> {
    return this._repository.getAll(this.name);
  }

  async clear(): Promise<void | number> {
    return this._repository.clear(this.name);
  }
}

export class StateController implements Base.StateControllerI {
  repository: StateRepository;

  constructor(repository: StateRepository) {
    this.repository = repository;
  }

  channelState(channel: MachinatChannel): StateAccessor {
    return new StateAccessor(this.repository, `chan:${channel.uid}`);
  }

  userState(user: MachinatUser): StateAccessor {
    return new StateAccessor(this.repository, `user:${user.uid}`);
  }

  globalState(name: string): StateAccessor {
    return new StateAccessor(this.repository, name);
  }
}

export default provider<StateController>({
  lifetime: 'scoped',
  deps: [StateRepositoryI],
})(StateController);
