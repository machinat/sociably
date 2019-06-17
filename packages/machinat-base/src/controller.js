// @flow
import { compose } from 'machinat-utility';

import type { MachinatNode } from 'machinat/types';
import type {
  EventMiddleware,
  MachinatEvent,
  MachinatMetadata,
  EventHandler,
  MachinatChannel,
  EventFrame,
} from './types';

const EventFrameProto = {
  get platform() {
    return this.event.platform;
  },

  reply(nodes: MachinatNode, options: any) {
    return this.bot.send(this.channel, nodes, options);
  },
};

class MachinatController<
  Response,
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>
> {
  middlewares: EventMiddleware<any, Response, Channel, Event, Metadata>[];
  frame: typeof EventFrameProto;

  constructor() {
    this.middlewares = [];
    this.frame = Object.create(EventFrameProto);
  }

  setMiddlewares(
    ...fns: EventMiddleware<any, Response, Channel, Event, Metadata>[]
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
      EventFrame<any, any, any, any, Channel, Event, Metadata>
    ) => Promise<void | Response>
  ): EventHandler<Response, Channel, Event, Metadata> {
    const handle = compose(...this.middlewares)(onEvent);

    return (channel: Channel, event: Event, metadata: Metadata) => {
      const frame = this.createEventFrame(channel, event, metadata);

      return handle(frame);
    };
  }

  createEventFrame(
    channel: Channel,
    event: Event,
    metadata: Metadata
  ): EventFrame<any, any, any, any, Channel, Event, Metadata> {
    const frame = Object.create(this.frame);

    frame.channel = channel;
    frame.event = event;
    frame.metadata = metadata;

    return frame;
  }
}

export default MachinatController;
