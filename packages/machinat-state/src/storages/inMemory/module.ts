import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import { ControllerP } from '../../controller';
import { RepositoryI } from '../../interface';
import { InMemoryRepositoryP } from './repository';

const InMemoryState = {
  Repository: InMemoryRepositoryP,

  initModule: (): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },

      InMemoryRepositoryP,
      { provide: RepositoryI, withProvider: InMemoryRepositoryP },
    ],
  }),
};

declare namespace InMemoryState {
  export type Repository = InMemoryRepositoryP;
}

export default InMemoryState;
