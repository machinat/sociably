import type { MachinatUser } from '../types';
import { makeInterface, provider } from '../service';

export interface MachinatUserProfile {
  readonly platform: string;
  readonly id: string | number;
  readonly name: string;
  readonly pictureURL: void | string;
}

export interface MachinatProfiler {
  getUserProfile(user: MachinatUser): Promise<MachinatUserProfile>;
}

const PROFILER_BRANCHES_I = makeInterface<MachinatProfiler>({
  name: 'ProfilerPlatformBranches',
  branched: true,
});

/**
 * @category Base
 */
export class BaseProfiler implements MachinatProfiler {
  static PLATFORMS_I = PROFILER_BRANCHES_I;
  private _branches: Map<string, BaseProfiler>;

  constructor(branches: Map<string, BaseProfiler>) {
    this._branches = branches;
  }

  async getUserProfile(user: MachinatUser): Promise<MachinatUserProfile> {
    const profiler = this._branches.get(user.platform);
    if (!profiler) {
      throw new TypeError(
        `user of platform '${user.platform}' is not supported`
      );
    }

    return profiler.getUserProfile(user);
  }
}

export const ProfilerP = provider<BaseProfiler>({
  lifetime: 'transient',
  deps: [PROFILER_BRANCHES_I],
})(BaseProfiler);

export type ProfilerP = BaseProfiler;
