export default (): string => `
import {
  serviceProviderFactory,
  BaseProfiler,
  StateController,
  SociablyChannel,
  SociablyUser,
  SociablyProfile
 } from '@sociably/core';

type ProfileCache = {
  profile: SociablyProfile,
}

const useUserProfile =
  (profiler: BaseProfiler, stateController: StateController) =>
  async (channel: SociablyChannel, user: SociablyUser | null) => {
    if (!user) {
      return null;
    }

    const userState = stateController.userState(user);
    const cached = await userState.get<ProfileCache>(
      'profile_cache'
    );
    if (cached) {
      return cached.profile;
    }

    const profile = await profiler.getUserProfile(channel, user);
    if (profile) {
      await userState.set<ProfileCache>('profile_cache', { profile });
    }

    return profile;
  };

export default serviceProviderFactory({
  deps: [BaseProfiler, StateController],
})(useUserProfile);
`;
