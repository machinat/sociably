import type { MachinatChannel, MachinatUser } from '../types';
import { makeInterface } from '../service';

export interface StateAccessor {
  get<T>(key: string): Promise<undefined | T>;
  set<T>(key: string, value: T): Promise<boolean>;
  update<T>(
    key: string,
    updator: (state: undefined | T) => undefined | T
  ): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  getAll(): Promise<Map<string, any>>;
  clear(): Promise<undefined | number>;
}

/**
 * @category Base
 */
export interface BaseStateController {
  /**
   * Return the {@link StateAccessor} of a channel
   */
  channelState(
    /** The channel object or uid of the channel */
    channel: string | MachinatChannel
  ): StateAccessor;

  /**
   * Return the {@link StateAccessor} of a user
   */
  userState(
    /** The user object or uid of the user */
    user: string | MachinatUser
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
