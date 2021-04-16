import type { ServiceModule } from '@machinat/core';
import StateControllerI from '@machinat/core/base/StateController';
import { ControllerP } from './controller';
import { ConfigsI, SerializerI } from './interface';

/**
 * @category Root
 */
namespace FileState {
  export const Controller = ControllerP;
  export type Controller = ControllerP;

  export const Serializer = SerializerI;
  export type Serializer = SerializerI;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: ConfigsI): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },

      { provide: ConfigsI, withValue: configs },
    ],
  });
}

export default FileState;
