export default (): string => `
import {
  makeFactoryProvider,
  BasicProfiler,
  StateController,
  SociablyUser,
  SociablyProfile
 } from '@sociably/core';

type ProfileCache = {
  profile: SociablyProfile,
}

const useUserProfile =
  (profiler: BasicProfiler, stateController: StateController) =>
  async (user: SociablyUser | null) => {
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

    const profile = await profiler.getUserProfile(user);
    if (profile) {
      await userState.set<ProfileCache>('profile_cache', { profile });
    }

    return profile;
  };

export default makeFactoryProvider({
  deps: [BasicProfiler, StateController],
})(useUserProfile);
`;
