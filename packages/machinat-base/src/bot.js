// @flow
import EventEmitter from 'events';
import { mixin } from 'machinat-utility';

import type { MachinatNode } from 'machinat/types';
import type { MachinatNativeComponent } from 'machinat-renderer/types';
import type {
  BotPlugin,
  EventHandler,
  MachinatChannel,
  MachinatEvent,
  MachinatTransport,
  MachinatReceiver,
} from './types';

import Controller from './controller';
import Engine from './engine';

export default class BaseBot<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Response,
  Job,
  Result
> extends EventEmitter {
  receiver: MachinatReceiver<Response, Channel, Event, Transport>;
  controller: Controller<Response, Channel, Event, Transport>;
  engine: Engine<SegmentValue, Native, Channel, Job, Result>;
  plugins:
    | void
    | BotPlugin<
        Channel,
        Event,
        Transport,
        SegmentValue,
        Native,
        Response,
        Job,
        Result
      >[];

  constructor(
    receiver: MachinatReceiver<Response, Channel, Event, Transport>,
    controller: Controller<Response, Channel, Event, Transport>,
    engine: Engine<SegmentValue, Native, Channel, Job, Result>,
    plugins?: BotPlugin<
      Channel,
      Event,
      Transport,
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
        return bot.send(this.channel, ...args);
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

  eventHandler(): EventHandler<Response, Channel, Event, Transport> {
    return this.controller.makeEventHandler(frame => {
      this.emit('event', frame);
      return Promise.resolve();
    });
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  send(channel: Channel, message: MachinatNode, options: any) {
    throw new TypeError('Bot#send() should not be called on BaseBot');
  }

  _emitError = (err: Error) => {
    this.emit('error', err, this);
  };
}
