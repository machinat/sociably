import type { ServiceModule } from '@machinat/core/types';
import StateControllerI from '@machinat/core/base/StateController';
import { ControllerP } from './controller';

/**
 * @category Root
 */
const InMemoryState = {
  Controller: ControllerP,

  initModule: (): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },
    ],
  }),
};

/**
 * @category Root
 */
declare namespace InMemoryState {
  export type Controller = ControllerP;
}

export default InMemoryState;
