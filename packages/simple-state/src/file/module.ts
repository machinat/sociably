import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import { ControllerP } from './controller';
import {
  ConfigsI as StateConfigsI,
  SerializerI as StateSerializerI,
} from './interface';

const FileState = {
  Controller: ControllerP,
  SerializerI: StateSerializerI,
  ConfigsI: StateConfigsI,

  initModule: (configs: StateConfigsI): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },

      { provide: StateConfigsI, withValue: configs },
    ],
  }),
};

declare namespace FileState {
  export type Controller = ControllerP;
  export type SerializerI = StateSerializerI;
  export type ConfigsI = StateConfigsI;
}

export default FileState;
