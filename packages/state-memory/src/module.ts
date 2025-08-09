import type { ServiceModule } from '@sociably/core';
import MemoryRepositoryI from '@sociably/core/base/MemoryRepository.js';

import StateMemoryRepositoryP from './StateMemoryRepository.js';

/** @category Root */
namespace StateMemory {
  export const Repository = StateMemoryRepositoryP;
  export type Repository = StateMemoryRepositoryP;

  export const initModule = (): ServiceModule => ({
    provisions: [
      StateMemoryRepositoryP,
      { provide: MemoryRepositoryI, withProvider: StateMemoryRepositoryP },
    ],
  });
}

export default StateMemory;
