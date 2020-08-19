import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import { StateRepositoryI } from '../../interface';
import ControllerP from '../../controller';
import RepositoryP, { FileRepository } from './repository';
import {
  FILE_STATE_CONFIGS_I,
  FileStateSerializerI,
  FileStateSerializer,
} from './interface';
import type { FileRepositoryConfigs } from './types';

const FileState = {
  Repository: RepositoryP,
  CONFIGS_I: FILE_STATE_CONFIGS_I,
  SerializerI: FileStateSerializerI,

  initModule: (configs: FileRepositoryConfigs): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },

      RepositoryP,
      { provide: StateRepositoryI, withProvider: RepositoryP },

      { provide: FILE_STATE_CONFIGS_I, withValue: configs },
    ],
  }),
};

declare namespace FileState {
  export type Repository = FileRepository;
  export type SerializerI = FileStateSerializer;
}

export default FileState;
