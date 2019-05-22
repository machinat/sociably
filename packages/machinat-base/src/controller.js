// @flow
import { compose } from 'machinat-utility';

import type { MachinatNode } from 'machinat/types';
import type {
  EventMiddleware,
  MachinatEvent,
  MachinatTransport,
  EventHandler,
  MachinatThread,
  EventFrame,
} from './types';

const EventFrameProto = {
  get platform() {
    return this.event.platform;
  },

  reply(nodes: MachinatNode, options: any) {
    return this.bot.send(this.thread, nodes, options);
  },
};

class MachinatController<
  Response,
  Thread: MachinatThread,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> {
  middlewares: EventMiddleware<any, Response, Thread, Event, Transport>[];
  frame: typeof EventFrameProto;

  constructor() {
    this.middlewares = [];
    this.frame = Object.create(EventFrameProto);
  }

  setMiddlewares(
    ...fns: EventMiddleware<any, Response, Thread, Event, Transport>[]
  ) {
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
      EventFrame<any, any, any, any, Thread, Event, Transport>
    ) => Promise<void | Response>
  ): EventHandler<Response, Thread, Event, Transport> {
    const handle = compose(...this.middlewares)(onEvent);

    return (thread: Thread, event: Event, transport: Transport) => {
      const frame = this.createEventFrame(thread, event, transport);

      return handle(frame);
    };
  }

  createEventFrame(
    thread: Thread,
    event: Event,
    transport: Transport
  ): EventFrame<any, any, any, any, Thread, Event, Transport> {
    const frame = Object.create(this.frame);

    frame.thread = thread;
    frame.event = event;
    frame.transport = transport;

    return frame;
  }
}

export default MachinatController;
