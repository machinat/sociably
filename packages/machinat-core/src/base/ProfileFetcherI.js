// @flow
import { abstractInterface } from '../service';
import { MachinatUser } from '../types';

interface MachinatUserProfile {
  +platform: any;
  +id: string;
  +name: string;
  +pictureURL: void | string;
}

class AbstractProfileFetcher {
  +fetchProfile: (user: MachinatUser) => MachinatUserProfile;
}

export default abstractInterface<AbstractProfileFetcher>({
  name: 'ProfileFetcher',
})(AbstractProfileFetcher);
