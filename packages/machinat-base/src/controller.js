// @flow
import { compose } from './utils';
import ReceiveFrame from './receiveFrame';
import type {
  ReceiveMiddleware,
  MachinatEvent,
  EventHandler,
  MachinatThread,
} from './types';
import type MachinatBot from './bot';

class MachinatController<
  Response,
  Thread: MachinatThread<any, any>,
  Event: MachinatEvent<any, Thread>
> {
  middlewares: ReceiveMiddleware<any, Response, Thread, Event>[];

  constructor() {
    this.middlewares = [];
  }

  use(...fns: ReceiveMiddleware<any, Response, Thread, Event>[]) {
    for (const fn of fns) {
      if (typeof fn !== 'function') {
        throw new TypeError('middleware must be a function!');
      }
    }

    this.middlewares.push(...fns);

    return this;
  }

  makeEventHandler(
    bot: MachinatBot<any, any, any, any, any, Response, Thread, Event>,
    finalHandler: (
      ReceiveFrame<any, any, any, any, Thread, Event>
    ) => Promise<void | Response>,
    onError: Error => void
  ): EventHandler<Response, Thread, Event> {
    const handle = compose(...this.middlewares)(finalHandler);
    const handleError = err => {
      onError(err);
      throw err;
    };

    return (event: Event, source: string, transportContext: any) => {
      const frame = new ReceiveFrame(event, bot, source, transportContext);
      return handle(frame).catch(handleError);
    };
  }
}

export default MachinatController;
