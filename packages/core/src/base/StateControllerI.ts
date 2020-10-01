import type { MachinatChannel, MachinatUser } from '../types';
import { abstractInterface } from '../service';

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
export abstract class BaseStateController {
  abstract channelState(channel: MachinatChannel): StateAccessor;

  abstract userState(user: MachinatUser): StateAccessor;

  abstract globalState(name: string): StateAccessor;
}

export const StateControllerI = abstractInterface<BaseStateController>({
  name: 'BaseStateControllerI',
})(BaseStateController);

export type StateControllerI = BaseStateController;
