// @flow
import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import StateController from '../../controller';
import { StateRepositoryI } from '../../interface';
import InMemoryRepository from './repository';

const InMemoryState = {
  Repository: InMemoryRepository,

  initModule: (): ServiceModule => ({
    provisions: [
      StateController,
      { provide: Base.StateControllerI, withProvider: StateController },

      InMemoryRepository,
      { provide: StateRepositoryI, withProvider: InMemoryRepository },
    ],
  }),
};

export default InMemoryState;
