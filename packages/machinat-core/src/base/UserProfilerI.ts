import type { MachinatUser } from '../types';
import { abstractInterface } from '../service';

export interface MachinatUserProfile {
  readonly platform: string;
  readonly id: string;
  readonly name: string;
  readonly pictureURL: void | string;
}

/**
 * @category Base
 */
export abstract class BaseUserProfiler {
  abstract fetchProfile(user: MachinatUser): Promise<MachinatUserProfile>;
}

export const UserProfilerI = abstractInterface<BaseUserProfiler>({
  name: 'BaseUserProfilerI',
})(BaseUserProfiler);

export type UserProfilerI = BaseUserProfiler;
