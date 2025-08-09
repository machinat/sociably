import type {
  SociablyChannel,
  SociablyUser,
  SociablyThread,
} from '@sociably/core';
import {
  MemoryAccessor,
  BaseMemoryRepository,
} from '@sociably/core/base/MemoryRepository.js';
import StateRepository, {
  StateAccessor,
} from '@sociably/core/base/StateRepository.js';
import { serviceProviderClass } from '@sociably/core/service';
import { nanoid } from 'nanoid';

const MEMORY_STATE_KEY_PREFIX = '$memory';

const generateStateKey = (resource: string, id: string) =>
  `${MEMORY_STATE_KEY_PREFIX}:${resource}:${id}`;

export class StateMemoryAccessor implements MemoryAccessor {
  private _stateAccessor: StateAccessor;

  constructor(stateAccessor: StateAccessor) {
    this._stateAccessor = stateAccessor;
  }

  async add<T>(resource: string, value: T): Promise<string> {
    const id = nanoid();
    const stateKey = generateStateKey(resource, id);
    await this._stateAccessor.set(stateKey, value);
    return id;
  }

  get<T>(resource: string, id: string): Promise<T | undefined> {
    const stateKey = generateStateKey(resource, id);
    return this._stateAccessor.get<T>(stateKey);
  }

  update<T>(resource: string, id: string, changes: Partial<T>): Promise<T> {
    const stateKey = generateStateKey(resource, id);
    return this._stateAccessor.update<T>(stateKey, (value) => {
      if (value === undefined) {
        throw new Error(
          `StateMemoryAccessor: resource "${resource}" with id "${id}" not found`,
        );
      }
      const nonEmptyChanges = Object.fromEntries(
        Object.entries(changes).filter(([, v]) => v !== undefined),
      );
      return { ...value, ...nonEmptyChanges };
    }) as Promise<T>;
  }

  delete(resource: string, id: string): Promise<boolean> {
    const stateKey = generateStateKey(resource, id);
    return this._stateAccessor.delete(stateKey);
  }

  async getAll<T>(resource: string): Promise<Record<string, T>> {
    const stateKeyPrefix = generateStateKey(resource, '');
    const memoryStates =
      await this._stateAccessor.getAllStartWithKey<T>(stateKeyPrefix);
    return Object.fromEntries(
      Array.from(memoryStates.entries()).map(([key, value]) => [
        key.slice(stateKeyPrefix.length),
        value,
      ]),
    );
  }
}

/** @category Provider */
export class StateMemoryRepository implements BaseMemoryRepository {
  private _stateRepository: StateRepository;

  constructor(stateRepository: StateRepository) {
    this._stateRepository = stateRepository;
  }

  channelMemory(channel: SociablyChannel): StateMemoryAccessor {
    return new StateMemoryAccessor(this._stateRepository.channelState(channel));
  }

  threadMemory(thread: SociablyThread): StateMemoryAccessor {
    return new StateMemoryAccessor(this._stateRepository.threadState(thread));
  }

  userMemory(user: SociablyUser): StateMemoryAccessor {
    return new StateMemoryAccessor(this._stateRepository.userState(user));
  }

  globalMemory(stateId: string): StateMemoryAccessor {
    return new StateMemoryAccessor(this._stateRepository.globalState(stateId));
  }
}

const RepositoryP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [StateRepository],
})(StateMemoryRepository);

type RepositoryP = StateMemoryRepository;

export default RepositoryP;
