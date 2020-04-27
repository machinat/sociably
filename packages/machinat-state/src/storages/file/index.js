// @flow
import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import StateController from '../../controller';
import { StateRepositoryI } from '../../interface';
import FileRepository from './repository';
import { FILE_STATE_CONFIGS_I } from './interface';
import type { FileRepositoryConfigs } from './types';

const FileState = {
  Repository: FileRepository,
  CONFIGS_I: FILE_STATE_CONFIGS_I,

  initModule: (configs: FileRepositoryConfigs): ServiceModule => ({
    provisions: [
      StateController,
      { provide: Base.StateControllerI, withProvider: StateController },

      FileRepository,
      { provide: StateRepositoryI, withProvider: FileRepository },
      { provide: FILE_STATE_CONFIGS_I, withValue: configs },
    ],
  }),
};

export default FileState;
