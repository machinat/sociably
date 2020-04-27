// @flow
import { provider } from '@machinat/core/service';
import { StateRepositoryI } from '../../interface';

class InMemoryRepositroy implements StateRepositoryI {
  _storage: Map<string, Map<string, any>>;

  constructor() {
    this._storage = new Map();
  }

  async get(name: string, key: string) {
    const states = this._storage.get(name);
    return states?.get(key);
  }

  async set(name: string, key: string, state: any) {
    const states = this._storage.get(name);

    let isExisted = false;
    if (states) {
      isExisted = states.has(key);
      states.set(key, state);
    } else {
      this._storage.set(name, new Map([[key, state]]));
    }

    return isExisted;
  }

  async delete(name: string, key: string) {
    const states = this._storage.get(name);
    if (!states) {
      return false;
    }

    const isExisted = states.delete(key);
    if (isExisted && states.size === 0) {
      this._storage.delete(name);
    }

    return isExisted;
  }

  async getAll(name: string) {
    return this._storage.get(name) || null;
  }

  async clear(name: string) {
    this._storage.delete(name);
  }
}

export default provider<InMemoryRepositroy>({ lifetime: 'singleton' })(
  InMemoryRepositroy
);
