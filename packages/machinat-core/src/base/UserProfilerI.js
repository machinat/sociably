// @flow
/* eslint-disable class-methods-use-this */
import { abstractInterface } from '../service';
import { MachinatUser } from '../types';

export interface MachinatUserProfile {
  +platform: any;
  +id: string;
  +name: string;
  +pictureURL: void | string;
}

export class AbstractUserProfiler {
  fetchProfile(_user: MachinatUser): MachinatUserProfile {
    throw new TypeError('method called on abstract class');
  }
}

export default abstractInterface<AbstractUserProfiler>({
  name: 'BaseUserProfiler',
})(AbstractUserProfiler);
