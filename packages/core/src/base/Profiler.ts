import type { SociablyUser, SociablyChannel } from '../types';
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

export interface UserProfiler<
  Channel extends SociablyChannel,
  User extends SociablyUser
> {
  getUserProfile(channel: Channel, user: User): Promise<null | SociablyProfile>;
}

type AnyUserProfiler = UserProfiler<SociablyChannel, SociablyUser>;

/**
 * @category Base
 */
export class BaseProfiler implements AnyUserProfiler {
  static PlatformMap = makeInterface<AnyUserProfiler>({
    name: 'ProfilerPlatformMap',
    polymorphic: true,
  });

  private _platformMapping: Map<string, AnyUserProfiler>;

  constructor(platformMapping: Map<string, AnyUserProfiler>) {
    this._platformMapping = platformMapping;
  }

  async getUserProfile(
    channel: SociablyChannel,
    user: SociablyUser
  ): Promise<null | SociablyProfile> {
    if (channel.platform !== user.platform) {
      throw new TypeError(
        `channel (${channel.platform}) and user (${user.platform}) platforms mismatch`
      );
    }
    const profiler = this._platformMapping.get(user.platform);
    if (!profiler) {
      throw new TypeError(
        `getting profile on "${user.platform}" platform is not supported`
      );
    }

    return profiler.getUserProfile(channel, user);
  }
}

const ProfilerP = makeClassProvider({
  lifetime: 'transient',
  deps: [BaseProfiler.PlatformMap],
})(BaseProfiler);

type ProfilerP = AnyUserProfiler;

export default ProfilerP;
