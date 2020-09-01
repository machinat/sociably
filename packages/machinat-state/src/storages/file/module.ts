import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import { RepositoryI } from '../../interface';
import { ControllerP } from '../../controller';
import { FileRepositoryP } from './repository';
import { MODULE_CONFIGS_I, SerializerI as StateSerializerI } from './interface';
import type { FileRepositoryConfigs } from './types';

const FileState = {
  Repository: FileRepositoryP,
  CONFIGS_I: MODULE_CONFIGS_I,
  SerializerI: StateSerializerI,

  initModule: (configs: FileRepositoryConfigs): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },

      FileRepositoryP,
      { provide: RepositoryI, withProvider: FileRepositoryP },

      { provide: MODULE_CONFIGS_I, withValue: configs },
    ],
  }),
};

declare namespace FileState {
  export type Repository = FileRepositoryP;
  export type SerializerI = StateSerializerI;
}

export default FileState;
