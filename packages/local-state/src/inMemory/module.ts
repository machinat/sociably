import type { ServiceModule } from '@machinat/core/types';
import StateControllerI from '@machinat/core/base/StateController';
import { ControllerP } from './controller';

/**
 * @category Root
 */
namespace InMemoryState {
  export const Controller = ControllerP;
  export type Controller = ControllerP;

  export const initModule = (): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },
    ],
  });
}

export default InMemoryState;
