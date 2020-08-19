import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import ControllerP from '../../controller';
import { StateRepositoryI } from '../../interface';
import RepositoryP, { InMemoryRepository } from './repository';

const InMemoryState = {
  Repository: RepositoryP,

  initModule: (): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },

      RepositoryP,
      { provide: StateRepositoryI, withProvider: RepositoryP },
    ],
  }),
};

declare namespace InMemoryState {
  export type Repository = InMemoryRepository;
}

export default InMemoryState;
