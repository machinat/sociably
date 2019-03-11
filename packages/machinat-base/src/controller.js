// @flow
import type { MachinatNode } from 'machinat/types';
import { compose } from './utils';
import type {
  ReceiveMiddleware,
  MachinatEvent,
  EventHandler,
  MachinatThread,
  ReceiveFrame,
  MachinatBot,
} from './types';

const ReceiveFrameProto = {
  get platform() {
    return this.event.platform;
  },

  get type() {
    return this.event.type;
  },

  get subtype() {
    return this.event.sybtype;
  },

  get thread() {
    return this.event.thread;
  },

  react(nodes: MachinatNode, options: any) {
    return this.bot.engine.dispatch(this.event.thread, nodes, options);
  },
};

class MachinatController<
  Response,
  Thread: MachinatThread<any, any>,
  Event: MachinatEvent<any, Thread>
> {
  middlewares: ReceiveMiddleware<any, Response, Thread, Event>[];
  frame: typeof ReceiveFrameProto;

  constructor() {
    this.middlewares = [];
    this.frame = Object.create(ReceiveFrameProto);
  }

  setMiddlewares(...fns: ReceiveMiddleware<any, Response, Thread, Event>[]) {
    for (const fn of fns) {
      if (typeof fn !== 'function') {
        throw new TypeError('middleware must be a function!');
      }
    }

    this.middlewares = fns;
    return this;
  }

  setFramePrototype(mixin: Object) {
    this.frame = Object.defineProperties(
      Object.create(ReceiveFrameProto),
      Object.getOwnPropertyDescriptors(mixin)
    );

    return this;
  }

  makeEventHandler(
    bot: MachinatBot<any, any, any, any, any, Response, Thread, Event>,
    onEvent: (
      ReceiveFrame<any, any, any, any, Thread, Event>
    ) => Promise<void | Response>,
    onError: Error => void
  ): EventHandler<Response, Thread, Event> {
    const handle = compose(...this.middlewares)(onEvent);
    const handleError = err => {
      onError(err);
      throw err;
    };

    return (source: string, event: Event, transportContext: any) => {
      const frame = this.createReceiveFrame(
        source,
        event,
        bot,
        transportContext
      );

      return handle(frame).catch(handleError);
    };
  }

  createReceiveFrame(
    source: string,
    event: Event,
    bot: MachinatBot<any, any, any, any, any, Response, Thread, Event>,
    transportContext: any
  ): ReceiveFrame<any, any, any, any, Thread, Event> {
    const frame = Object.create(this.frame);

    frame.bot = bot;
    frame.event = event;
    frame.source = source;
    frame.transportContext = transportContext;

    return frame;
  }
}

export default MachinatController;
