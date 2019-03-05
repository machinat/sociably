// @flow
import EventEmitter from 'events';
import type { MachinatNativeType } from 'machinat-renderer/types';
import type { BotPlugin, EventHandler, MachinatThread } from './types';
import type MachinatController from './controller';
import type MachinatEngine from './engine';

export default class BaseBot<
  RawEvent,
  Response,
  Rendered,
  Native: MachinatNativeType<Rendered>,
  Job,
  Result,
  Deliverable: MachinatThread<Job, any>,
  Receivable: Deliverable
> extends EventEmitter {
  controller: MachinatController<RawEvent, Response, Receivable>;
  engine: MachinatEngine<Rendered, Native, Job, Result, Deliverable>;

  constructor(
    controller: MachinatController<RawEvent, Response, Receivable>,
    engine: MachinatEngine<Rendered, Native, Job, Result, Deliverable>,
    plugins?: BotPlugin<
      RawEvent,
      Response,
      Rendered,
      Native,
      Job,
      Result,
      Deliverable,
      Receivable
    >[]
  ) {
    super();

    this.engine = engine;
    this.controller = controller;

    if (plugins) {
      const receivingMiddlewares = [];
      const sendingMiddlewares = [];

      for (const createPlugin of plugins) {
        const { sendMiddleware, receiveMiddleware } = createPlugin(this);

        if (sendMiddleware) sendingMiddlewares.push(sendMiddleware);
        if (receiveMiddleware) receivingMiddlewares.push(receiveMiddleware);
      }

      this.controller.use(...receivingMiddlewares);
      this.engine.use(...sendingMiddlewares);
    }

    this.engine.start();
  }

  eventHandler(): EventHandler<RawEvent, Response, Receivable> {
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
