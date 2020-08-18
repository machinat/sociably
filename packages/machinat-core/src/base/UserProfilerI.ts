import type { MachinatUser } from '../types';
import { abstractInterface } from '../service';

export interface MachinatUserProfile {
  readonly platform: string;
  readonly id: string;
  readonly name: string;
  readonly pictureURL: void | string;
}

@abstractInterface<UserProfilerI>({
  name: 'BaseUserProfiler',
})
abstract class UserProfilerI {
  abstract fetchProfile(user: MachinatUser): Promise<MachinatUserProfile>;
}

export default UserProfilerI;
