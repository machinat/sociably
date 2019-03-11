// @flow
import EventEmitter from 'events';
import { mixin } from 'machinat-utility';
import type { MachinatNativeType } from 'machinat-renderer/types';
import type {
  BotPlugin,
  EventHandler,
  MachinatThread,
  MachinatEvent,
  MachinatAdaptor,
} from './types';
import Controller from './controller';
import Engine from './engine';

export default class BaseBot<
  Rendered,
  Native: MachinatNativeType<Rendered>,
  Job,
  Result,
  Deliverable: MachinatThread<Job, any>,
  Response,
  Receivable: Deliverable,
  Event: MachinatEvent<any, Receivable>
> extends EventEmitter {
  adaptor: MachinatAdaptor<Response, Receivable, Event>;
  controller: Controller<Response, Receivable, Event>;
  engine: Engine<Rendered, Native, Job, Result, Deliverable>;
  plugins:
    | void
    | BotPlugin<
        Rendered,
        Native,
        Job,
        Result,
        Deliverable,
        Response,
        Receivable,
        Event
      >[];

  constructor(
    adaptor: MachinatAdaptor<Response, Receivable, Event>,
    controller: Controller<Response, Receivable, Event>,
    engine: Engine<Rendered, Native, Job, Result, Deliverable>,
    plugins?: BotPlugin<
      Rendered,
      Native,
      Job,
      Result,
      Deliverable,
      Response,
      Receivable,
      Event
    >[]
  ) {
    super();

    this.adaptor = adaptor;
    this.controller = controller;
    this.engine = engine;
    this.plugins = plugins;

    if (plugins) {
      const receiveMws = [];
      const dispatchMws = [];
      const receiveExts = [];
      const dispatchExts = [];

      for (const plugin of plugins) {
        const {
          dispatchMiddleware,
          dispatchFrameExtension,
          receiveMiddleware,
          receiveFrameExtension,
        } = plugin(this);

        if (receiveMiddleware) receiveMws.push(receiveMiddleware);
        if (dispatchMiddleware) dispatchMws.push(dispatchMiddleware);

        if (receiveFrameExtension) receiveExts.push(receiveFrameExtension);
        if (dispatchFrameExtension) dispatchExts.push(dispatchFrameExtension);
      }

      this.controller.setMiddlewares(...receiveMws);
      this.controller.setFramePrototype(mixin(...receiveExts));

      this.engine.setMiddlewares(...dispatchMws);
      this.engine.setFramePrototype(mixin(...dispatchExts));
    }

    this.engine.start();
    this.adaptor.bind(this.eventHandler());
  }

  eventHandler(): EventHandler<Response, Receivable, Event> {
    return this.controller.makeEventHandler(
      this,
      frame => {
        this.emit('event', frame);
        return Promise.resolve();
      },
      err => {
        this.emit('error', err, this);
      }
    );
  }
}
