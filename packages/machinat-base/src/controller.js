// @flow
import { compose } from './utils';
import Context from './context';
import type {
  ReceiveMiddleware,
  MachinatEvent,
  EventHandler,
  MachinatThread,
} from './types';
import type MachinatBot from './bot';
import type ReceiveContext from './context';

class MachinatController<Raw, Response, Thread: MachinatThread<any, any>> {
  middlewares: ReceiveMiddleware<Raw, Response, any, Thread>[];

  constructor() {
    this.middlewares = [];
  }

  use(...fns: ReceiveMiddleware<Raw, Response, any, Thread>[]) {
    for (const fn of fns) {
      if (typeof fn !== 'function') {
        throw new TypeError('middleware must be a function!');
      }
    }

    this.middlewares.push(...fns);

    return this;
  }

  makeEventHandler(
    bot: MachinatBot<Raw, Response, any, any, any, any, any, Thread>,
    finalHandler: (
      ReceiveContext<Raw, any, any, any, any, Thread>
    ) => Promise<void | Response>,
    onError: Error => void
  ): EventHandler<Raw, Response, Thread> {
    const handle = compose(...this.middlewares)(finalHandler);
    const handleError = err => {
      onError(err);
      throw err;
    };

    return (
      event: MachinatEvent<Raw, Thread>,
      source: string,
      transportContext: any
    ) =>
      handle(new Context(event, bot, source, transportContext)).catch(
        handleError
      );
  }
}

export default MachinatController;
