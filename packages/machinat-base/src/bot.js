// @flow
import EventEmitter from 'events';
import { mixin } from 'machinat-utility';

import type { MachinatNode } from 'machinat/types';
import type { MachinatNativeType } from 'machinat-renderer/types';
import type {
  BotPlugin,
  EventHandler,
  MachinatThread,
  MachinatEvent,
  MachinatReceiver,
} from './types';

import Controller from './controller';
import Engine from './engine';

export default class BaseBot<
  Thread: MachinatThread,
  Event: MachinatEvent<any, Thread>,
  SegmentValue,
  Native: MachinatNativeType<SegmentValue>,
  Response,
  Job,
  Result
> extends EventEmitter {
  receiver: MachinatReceiver<Response, Thread, Event>;
  controller: Controller<Response, Thread, Event>;
  engine: Engine<SegmentValue, Native, Thread, Job, Result>;
  plugins:
    | void
    | BotPlugin<Thread, Event, SegmentValue, Native, Response, Job, Result>[];

  constructor(
    receiver: MachinatReceiver<Response, Thread, Event>,
    controller: Controller<Response, Thread, Event>,
    engine: Engine<SegmentValue, Native, Thread, Job, Result>,
    plugins?: BotPlugin<
      Thread,
      Event,
      SegmentValue,
      Native,
      Response,
      Job,
      Result
    >[]
  ) {
    super();

    this.receiver = receiver;
    this.controller = controller;
    this.engine = engine;
    this.plugins = plugins;

    const bot = this;
    const engineMixin = { bot };
    const controllerMixin = {
      bot,
      reply(...args) {
        return bot.send(this.thread, ...args);
      },
    };

    if (plugins) {
      const eventMiddlewares = [];
      const dispatchMiddlewares = [];
      const eventExtenstions = [];
      const dispatchExtenstions = [];

      for (const plugin of plugins) {
        const {
          dispatchMiddleware,
          dispatchFrameExtension,
          eventMiddleware,
          eventFrameExtension,
        } = plugin(this);

        if (eventMiddleware) eventMiddlewares.push(eventMiddleware);
        if (dispatchMiddleware) dispatchMiddlewares.push(dispatchMiddleware);

        if (eventFrameExtension) eventExtenstions.push(eventFrameExtension);
        if (dispatchFrameExtension)
          dispatchExtenstions.push(dispatchFrameExtension);
      }

      this.controller.setMiddlewares(...eventMiddlewares);
      this.controller.setFramePrototype(
        mixin(controllerMixin, ...eventExtenstions)
      );

      this.engine.setMiddlewares(...dispatchMiddlewares);
      this.engine.setFramePrototype(mixin(engineMixin, ...dispatchExtenstions));
    } else {
      this.controller.setFramePrototype(controllerMixin);
      this.engine.setFramePrototype(engineMixin);
    }

    this.receiver.bind(this.eventHandler(), this._emitError);
  }

  eventHandler(): EventHandler<Response, Thread, Event> {
    return this.controller.makeEventHandler(frame => {
      this.emit('event', frame);
      return Promise.resolve();
    });
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  send(thread: Thread, message: MachinatNode, options: any) {
    throw new TypeError('Bot#send() should not be called on BaseBot');
  }

  _emitError = (err: Error) => {
    this.emit('error', err, this);
  };
}
