// @flow
import type { ServiceModule } from '@machinat/core/types';
import { StateRepositoryI } from '../../interface';
import FileRepository from './repository';
import { FILE_STORAGE_CONFIGS_I } from './interface';
import type { FileRepositoryConfigs } from './types';

const FileStorage = {
  Repository: FileRepository,
  CONFIGS_I: FILE_STORAGE_CONFIGS_I,

  initModule: (configs: FileRepositoryConfigs): ServiceModule => ({
    provisions: [
      FileRepository,
      { provide: StateRepositoryI, withProvider: FileRepository },
      { provide: FILE_STORAGE_CONFIGS_I, withValue: configs },
    ],
  }),
};

export default FileStorage;
