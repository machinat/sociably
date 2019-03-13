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
      const eventMws = [];
      const dispatchMws = [];
      const eventExts = [];
      const dispatchExts = [];

      for (const plugin of plugins) {
        const {
          dispatchMiddleware,
          dispatchFrameExtension,
          eventMiddleware,
          eventFrameExtension,
        } = plugin(this);

        if (eventMiddleware) eventMws.push(eventMiddleware);
        if (dispatchMiddleware) dispatchMws.push(dispatchMiddleware);

        if (eventFrameExtension) eventExts.push(eventFrameExtension);
        if (dispatchFrameExtension) dispatchExts.push(dispatchFrameExtension);
      }

      this.controller.setMiddlewares(...eventMws);
      this.controller.setFramePrototype(mixin(...eventExts));

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
