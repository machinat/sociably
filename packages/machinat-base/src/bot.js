// @flow
import EventEmitter from 'events';
import type { MachinatNode } from 'machinat/types';
import type { MachinatNativeType } from 'machinat-renderer/types';
import type {
  SendResponse,
  BotPlugin,
  EventHandler,
  MachinatThread,
  OptionsOf,
} from './types';
import type MachinatController from './controller';
import type MachinatEngine from './engine';

export default class BaseBot<
  RawEvent,
  Response,
  Rendered,
  Native: MachinatNativeType<Rendered>,
  Job,
  Result,
  DeliverableThread: MachinatThread<Job, any>,
  ReceivableThread: DeliverableThread
> extends EventEmitter {
  controller: MachinatController<RawEvent, Response, ReceivableThread>;
  engine: MachinatEngine<Rendered, Native, Job, Result, DeliverableThread>;

  constructor(
    controller: MachinatController<RawEvent, Response, ReceivableThread>,
    engine: MachinatEngine<Rendered, Native, Job, Result, DeliverableThread>,
    plugins?: BotPlugin<
      RawEvent,
      Response,
      Rendered,
      Native,
      Job,
      Result,
      DeliverableThread,
      ReceivableThread
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

  deliver<Thread: DeliverableThread>(
    thread: Thread,
    message: MachinatNode,
    options: OptionsOf<Thread>
  ): Promise<SendResponse<Rendered, Native, Job, Result>> {
    return this.engine.process(thread, message, options);
  }

  eventHandler(): EventHandler<RawEvent, Response, ReceivableThread> {
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
