import type { SociablyThread, SociablyUser } from '../types';
import { makeInterface } from '../service';

export interface StateAccessor {
  /**
   * Fetch the value of a specific key. Return `undefined` if no value is
   * stored.
   */
  get<T>(key: string): Promise<undefined | T>;
  /**
   * Store the value on a specific key. Return `true` if the old value is
   * updated, `false` if it's newly stored on the key.
   */
  set<T>(key: string, value: T): Promise<boolean>;
  /**
   * Update the value of a specific key by an undator funcction. The updator
   * receives the original value (`undefined` if not existed) and return the new
   * value. Depends on the new value, 3 kinds of action will be executed:
   * - `undefined`; delete the data on the key.
   * - original value (compared with `===`); no changes.
   * - any other value; the new value will be stored.
   */
  update<T>(key: string, updator: (state: undefined | T) => T): Promise<T>;
  update<T>(
    key: string,
    updator: (state: undefined | T) => undefined | T
  ): Promise<undefined | T>;
  delete(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  getAll<T>(): Promise<Map<string, T>>;
  clear(): Promise<undefined | number>;
}

/**
 * @category Base
 */
export interface BaseStateController {
  /**
   * Return the {@link StateAccessor} of a thread
   */
  threadState(
    /** The thread object or uid of the thread */
    thread: string | SociablyThread
  ): StateAccessor;

  /**
   * Return the {@link StateAccessor} of a user
   */
  userState(
    /** The user object or uid of the user */
    user: string | SociablyUser
  ): StateAccessor;

  /**
   * Return the {@link StateAccessor} of a global name
   */
  globalState(name: string): StateAccessor;
}

const StateControllerI = makeInterface<BaseStateController>({
  name: 'BaseStateController',
});

type StateControllerI = BaseStateController;

export default StateControllerI;
