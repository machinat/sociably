// @flow
import type { MachinatNode } from 'machinat/types';
import { compose } from './utils';
import type {
  EventMiddleware,
  MachinatEvent,
  EventHandler,
  MachinatThread,
  EventFrame,
} from './types';

const EventFrameProto = {
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
  middlewares: EventMiddleware<any, Response, Thread, Event>[];
  frame: typeof EventFrameProto;

  constructor() {
    this.middlewares = [];
    this.frame = Object.create(EventFrameProto);
  }

  setMiddlewares(...fns: EventMiddleware<any, Response, Thread, Event>[]) {
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
      Object.create(EventFrameProto),
      Object.getOwnPropertyDescriptors(mixin)
    );

    return this;
  }

  makeEventHandler(
    onEvent: (
      EventFrame<any, any, any, any, Thread, Event>
    ) => Promise<void | Response>,
    onError: Error => void
  ): EventHandler<Response, Thread, Event> {
    const handle = compose(...this.middlewares)(onEvent);
    const handleError = err => {
      onError(err);
      throw err;
    };

    return (source: string, event: Event, transportContext: any) => {
      const frame = this.createEventFrame(source, event, transportContext);

      return handle(frame).catch(handleError);
    };
  }

  createEventFrame(
    source: string,
    event: Event,
    transportContext: any
  ): EventFrame<any, any, any, any, Thread, Event> {
    const frame = Object.create(this.frame);

    frame.event = event;
    frame.source = source;
    frame.transportContext = transportContext;

    return frame;
  }
}

export default MachinatController;