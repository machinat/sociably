import { SociablyChannel, SociablyThread, SociablyUser } from '../types.js';
import { serviceInterface } from '../service/index.js';

export interface MemoryAccessor {
  /** Add a value to a resource and return the generated id for the value. */
  add<T>(resource: string, value: T): Promise<string>;
  /**
   * Get the value of a specific resource by id. Return `undefined` if no value
   * is found.
   */
  get<T>(resource: string, id: string): Promise<T | undefined>;
  /** Get all values of a specific resource as a record object with id as keys. */
  getAll<T>(resource: string): Promise<Record<string, T>>;
  /**
   * Update the value of a specific resource by id with partial changes. Merges
   * the provided changes with the existing value and returns the updated value.
   * Throws an error if the resource with the specified id is not found.
   */
  update<T>(resource: string, id: string, changes: Partial<T>): Promise<T>;
  /**
   * Delete the value of a specific resource by id. Return `true` if the value
   * was deleted, `false` if no value was found.
   */
  delete(resource: string, id: string): Promise<boolean>;
}

/** @category Base */
export interface BaseMemoryRepository {
  /** Return the {@link MemoryAccessor} for a SociablyThread */
  threadMemory(
    /** The thread object */
    thread: SociablyThread,
  ): MemoryAccessor;
  /** Return the {@link MemoryAccessor} for a SociablyChannel */
  channelMemory(
    /** The channel object */
    channel: SociablyChannel,
  ): MemoryAccessor;
  /** Return the {@link MemoryAccessor} for a SociablyUser */
  userMemory(
    /** The user object */
    user: SociablyUser,
  ): MemoryAccessor;
  /** Return the {@link MemoryAccessor} for a global memory namespace */
  globalMemory(
    /** Optional namespace for the global memory */
    namespace?: string,
  ): MemoryAccessor;
}

const MemoryRepositoryI = serviceInterface<BaseMemoryRepository>({
  name: 'MemoryRepository',
});

type MemoryRepositoryI = BaseMemoryRepository;

export default MemoryRepositoryI;
