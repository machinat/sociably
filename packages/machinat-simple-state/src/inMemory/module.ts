import type { ServiceModule } from '@machinat/core/types';
import Base from '@machinat/core/base';
import { ControllerP } from './controller';

const InMemoryState = {
  Controller: ControllerP,

  initModule: (): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: Base.StateControllerI, withProvider: ControllerP },
    ],
  }),
};

declare namespace InMemoryState {
  export type Controller = ControllerP;
}

export default InMemoryState;
