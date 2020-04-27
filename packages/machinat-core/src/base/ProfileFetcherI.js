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

class AbstractProfileFetcher {
  fetchProfile(_user: MachinatUser): MachinatUserProfile {
    throw new TypeError('method called on abstract class');
  }
}

export default abstractInterface<AbstractProfileFetcher>({
  name: 'BaseProfileFetcher',
})(AbstractProfileFetcher);
