import type { MachinatUser } from '../types';
import { makeInterface, makeClassProvider } from '../service';

export interface MachinatProfile {
  readonly platform: string;
  readonly name: string;
  readonly pictureURL: undefined | string;
}

export interface UserProfiler<User extends MachinatUser> {
  getUserProfile(user: User): Promise<MachinatProfile>;
}

/**
 * @category Base
 */
export class BaseProfiler implements UserProfiler<MachinatUser> {
  static PLATFORMS_I = makeInterface<UserProfiler<any>>({
    name: 'ProfilerPlatformBranches',
    branched: true,
  });

  private _branches: Map<string, BaseProfiler>;

  constructor(branches: Map<string, BaseProfiler>) {
    this._branches = branches;
  }

  async getUserProfile(user: MachinatUser): Promise<MachinatProfile> {
    const profiler = this._branches.get(user.platform);
    if (!profiler) {
      throw new TypeError(
        `user of platform '${user.platform}' is not supported`
      );
    }

    return profiler.getUserProfile(user);
  }
}

export const ProfilerP = makeClassProvider({
  lifetime: 'transient',
  deps: [BaseProfiler.PLATFORMS_I] as const,
})(BaseProfiler);

export type ProfilerP = UserProfiler<MachinatUser>;
