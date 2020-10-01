import type { MachinatUser } from '../types';
import { abstractInterface } from '../service';

export interface MachinatUserProfile {
  readonly platform: string;
  readonly id: string | number;
  readonly name: string;
  readonly pictureURL: void | string;
}

/**
 * @category Base
 */
export abstract class BaseProfiler {
  abstract getUserProfile(user: MachinatUser): Promise<MachinatUserProfile>;
}

export const ProfilerI = abstractInterface<BaseProfiler>({
  name: 'BaseProfilerI',
})(BaseProfiler);

export type ProfilerI = BaseProfiler;
