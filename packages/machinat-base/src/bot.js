// @flow
import EventEmitter from 'events';
import type { MachinatNativeType } from 'machinat-renderer/types';
import type {
  BotPlugin,
  EventHandler,
  MachinatThread,
  MachinatEvent,
} from './types';
import type MachinatController from './controller';
import type MachinatEngine from './engine';

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
  controller: MachinatController<Response, Receivable, Event>;
  engine: MachinatEngine<Rendered, Native, Job, Result, Deliverable>;

  constructor(
    controller: MachinatController<Response, Receivable, Event>,
    engine: MachinatEngine<Rendered, Native, Job, Result, Deliverable>,
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

    this.engine = engine;
    this.controller = controller;

    if (plugins) {
      const receivingMiddlewares = [];
      const sendingMiddlewares = [];

      for (const createPlugin of plugins) {
        const { dispatchMiddleware, receiveMiddleware } = createPlugin(this);

        if (dispatchMiddleware) sendingMiddlewares.push(dispatchMiddleware);
        if (receiveMiddleware) receivingMiddlewares.push(receiveMiddleware);
      }

      this.controller.use(...receivingMiddlewares);
      this.engine.use(...sendingMiddlewares);
    }

    this.engine.start();
  }

  eventHandler(): EventHandler<Response, Receivable, Event> {
    return this.controller.makeEventHandler(
      this,
      context => {
        this.emit('event', context);
        return Promise.resolve();
      },
      err => {
        this.emit('error', err);
      }
    );
  }
}
