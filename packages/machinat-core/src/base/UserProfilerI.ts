import type { MachinatUser } from '../types';
import { abstractInterface } from '../service';

export interface MachinatUserProfile {
  readonly platform: string;
  readonly id: string;
  readonly name: string;
  readonly pictureURL: void | string;
}

export abstract class BaseUserProfiler {
  abstract fetchProfile(user: MachinatUser): Promise<MachinatUserProfile>;
}

export default abstractInterface<BaseUserProfiler>({
  name: 'BaseUserProfilerI',
})(BaseUserProfiler);
