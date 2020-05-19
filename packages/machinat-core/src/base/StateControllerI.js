// @flow
/* eslint-disable class-methods-use-this */
import { abstractInterface } from '../service';
import { MachinatChannel, MachinatUser } from '../types';

interface StateAccessor {
  get<T>(key: string): Promise<void | T>;
  set<T>(key: string, updator: (state: void | T) => void | T): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  getAll(): Promise<null | Map<string, Object>>;
  clear(): Promise<void | number>;
}

class AbstractStateController {
  channelState(_channel: MachinatChannel): StateAccessor {
    throw new TypeError('method called on abstract class');
  }

  userState(_user: MachinatUser): StateAccessor {
    throw new TypeError('method called on abstract class');
  }

  globalState(_name: string): StateAccessor {
    throw new TypeError('method called on abstract class');
  }
}

export default abstractInterface<AbstractStateController>({
  name: 'BaseStateController',
})(AbstractStateController);
