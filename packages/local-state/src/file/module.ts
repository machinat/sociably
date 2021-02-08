import type { ServiceModule } from '@machinat/core/types';
import StateControllerI from '@machinat/core/base/StateController';
import { ControllerP } from './controller';
import { ConfigsI, SerializerI } from './interface';

/**
 * @category Root
 */
const FileState = {
  Controller: ControllerP,
  Serializer: SerializerI,
  Configs: ConfigsI,

  initModule: (configs: ConfigsI): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },

      { provide: ConfigsI, withValue: configs },
    ],
  }),
};

/**
 * @category Root
 */
declare namespace FileState {
  export type Controller = ControllerP;
  export type Serializer = SerializerI;
  export type Configs = ConfigsI;
}

export default FileState;
