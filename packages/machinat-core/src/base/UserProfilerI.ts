import type { MachinatUser } from '../types';
import { abstractInterface } from '../service';

interface MachinatUserProfile {
  readonly platform: string;
  readonly id: string;
  readonly name: string;
  readonly pictureURL: void | string;
}

export abstract class AbstractUserProfiler {
  abstract fetchProfile(user: MachinatUser): MachinatUserProfile;
}

export default abstractInterface<AbstractUserProfiler>({
  name: 'BaseUserProfiler',
})(AbstractUserProfiler);
