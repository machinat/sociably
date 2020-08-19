import { provider } from '@machinat/core/service';
import type { StateRepository } from '../../interface';

export class InMemoryRepository implements StateRepository {
  _storage: Map<string, Map<string, any>>;

  constructor() {
    this._storage = new Map();
  }

  async get<T>(name: string, key: string): Promise<T> {
    const states = this._storage.get(name);
    return states?.get(key);
  }

  async set<T>(name: string, key: string, state: T): Promise<boolean> {
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

  async delete(name: string, key: string): Promise<boolean> {
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

  async getAll(name: string): Promise<null | Map<string, any>> {
    return this._storage.get(name) || null;
  }

  async clear(name: string): Promise<void> {
    this._storage.delete(name);
  }
}

export default provider<InMemoryRepository>({
  lifetime: 'singleton',
})(InMemoryRepository);
