// @flow
import type { MachinatNode } from 'machinat/types';
import type { MachinatNativeType } from 'machinat-renderer/types';
import type MachinatBot from './bot';
import type { MachinatEvent, MachinatThread } from './types';

class MachinatReceiveFrame<
  Rendered,
  Native: MachinatNativeType<Rendered>,
  Job,
  Result,
  Thread: MachinatThread<Job, any>,
  Event: MachinatEvent<any, Thread>
> {
  event: Event;
  bot: MachinatBot<Rendered, Native, Job, Result, any, any, Thread, Event>;
  source: string;
  transportContext: any;

  constructor(
    event: Event,
    bot: MachinatBot<Rendered, Native, Job, Result, any, any, Thread, Event>,
    source: string,
    transportContext: any
  ) {
    this.bot = bot;
    this.event = event;
    this.source = source;
    this.transportContext = transportContext;
  }

  get platform() {
    return this.event.platform;
  }

  react(nodes: MachinatNode, options: any): Promise<null | Result[]> {
    return this.bot.engine.dispatch(this.event.thread, nodes, options);
  }
}

export default MachinatReceiveFrame;
