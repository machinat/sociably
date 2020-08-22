import type { MachinatChannel, MachinatUser } from '../types';
import { abstractInterface } from '../service';

export interface StateAccessor {
  get<T>(key: string): Promise<void | T>;
  set<T>(key: string, updator: (state: void | T) => void | T): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  getAll(): Promise<null | Map<string, any>>;
  clear(): Promise<void | number>;
}

export abstract class BaseStateController {
  abstract channelState(channel: MachinatChannel): StateAccessor;

  abstract userState(user: MachinatUser): StateAccessor;

  abstract globalState(name: string): StateAccessor;
}

export default abstractInterface<BaseStateController>({
  name: 'BaseStateControllerI',
})(BaseStateController);
