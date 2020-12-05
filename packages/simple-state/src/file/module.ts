import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import { ControllerP } from './controller';
import { MODULE_CONFIGS_I, SerializerI as StateSerializerI } from './interface';
import type { FileRepositoryConfigs } from './types';

const FileState = {
  Controller: ControllerP,
  CONFIGS_I: MODULE_CONFIGS_I,
  SerializerI: StateSerializerI,

  initModule: (configs: FileRepositoryConfigs): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },

      { provide: MODULE_CONFIGS_I, withValue: configs },
    ],
  }),
};

declare namespace FileState {
  export type Controller = ControllerP;
  export type SerializerI = StateSerializerI;
}

export default FileState;
