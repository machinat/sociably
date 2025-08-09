import type { ServiceModule } from '@sociably/core';
import StateRepositoryI from '@sociably/core/base/StateRepository.js';
import { RepositoryP } from './InMemoryStateRepository.js';

/** @category Root */
namespace InMemoryState {
  export const Repository = RepositoryP;
  export type Repository = RepositoryP;

  export const initModule = (): ServiceModule => ({
    provisions: [
      RepositoryP,
      { provide: StateRepositoryI, withProvider: RepositoryP },
    ],
  });
}

export default InMemoryState;
