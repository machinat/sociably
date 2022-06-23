import type { SociablyUser } from '../types';
import { makeInterface, makeClassProvider } from '../service';

export interface SociablyProfile {
  readonly platform: string;
  readonly name: string;
  readonly avatarUrl: undefined | string;
  readonly firstName: undefined | string;
  readonly lastName: undefined | string;
  readonly languageCode: undefined | string;
  readonly timeZone: undefined | number;
  data: any;
}

export interface UserProfiler<User extends SociablyUser> {
  getUserProfile(user: User): Promise<null | SociablyProfile>;
}

/**
 * @category Base
 */
export class BasicProfiler implements UserProfiler<SociablyUser> {
  static PlatformMap = makeInterface<UserProfiler<SociablyUser>>({
    name: 'ProfilerPlatformMap',
    polymorphic: true,
  });

  private _platformMapping: Map<string, UserProfiler<SociablyUser>>;

  constructor(platformMapping: Map<string, UserProfiler<SociablyUser>>) {
    this._platformMapping = platformMapping;
  }

  async getUserProfile(user: SociablyUser): Promise<null | SociablyProfile> {
    const profiler = this._platformMapping.get(user.platform);
    if (!profiler) {
      throw new TypeError(
        `user of platform '${user.platform}' is not supported`
      );
    }

    return profiler.getUserProfile(user);
  }
}

const ProfilerP = makeClassProvider({
  lifetime: 'transient',
  deps: [BasicProfiler.PlatformMap],
})(BasicProfiler);

type ProfilerP = UserProfiler<SociablyUser>;

export default ProfilerP;
