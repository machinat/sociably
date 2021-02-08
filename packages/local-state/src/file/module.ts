import type { ServiceModule } from '@machinat/core/types';
import StateControllerI from '@machinat/core/base/StateControllerI';
import { ControllerP } from './controller';
import {
  ConfigsI as StateConfigsI,
  SerializerI as StateSerializerI,
} from './interface';

/**
 * @category Root
 */
const FileState = {
  Controller: ControllerP,
  SerializerI: StateSerializerI,
  ConfigsI: StateConfigsI,

  initModule: (configs: StateConfigsI): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },

      { provide: StateConfigsI, withValue: configs },
    ],
  }),
};

/**
 * @category Root
 */
declare namespace FileState {
  export type Controller = ControllerP;
  export type SerializerI = StateSerializerI;
  export type ConfigsI = StateConfigsI;
}

export default FileState;
