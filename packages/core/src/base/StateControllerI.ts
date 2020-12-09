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
  channelState(channel: MachinatChannel): StateAccessor;

  userState(user: MachinatUser): StateAccessor;

  globalState(name: string): StateAccessor;
}

export const StateControllerI = makeInterface<BaseStateController>({
  name: 'BaseStateControllerI',
});

export type StateControllerI = BaseStateController;
