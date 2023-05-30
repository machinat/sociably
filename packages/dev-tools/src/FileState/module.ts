import type { ServiceModule } from '@sociably/core';
import StateControllerI from '@sociably/core/base/StateController';
import { ControllerP } from './controller.js';
import { ConfigsI, SerializerI } from './interface.js';

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
      { provide: ConfigsI, withValue: configs },
      {
        provide: SerializerI,
        withValue: {
          stringify: (obj: unknown) => JSON.stringify(obj, null, 2),
          parse: JSON.parse,
        },
      },

      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },
    ],
  });
}

export default FileState;
