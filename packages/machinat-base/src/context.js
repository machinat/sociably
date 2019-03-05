// @flow
import type { MachinatNode } from 'machinat/types';
import type { MachinatNativeType } from 'machinat-renderer/types';
import type MachinatBot from './bot';
import type { MachinatEvent, MachinatThread } from './types';

export default class MachinatReceiveContext<
  Raw,
  Rendered,
  Native: MachinatNativeType<Rendered>,
  Job,
  Result,
  Thread: MachinatThread<Job, any>
> {
  event: MachinatEvent<Raw, Thread>;
  bot: MachinatBot<Raw, any, Rendered, Native, Job, Result, any, Thread>;
  source: string;
  transportContext: any;

  constructor(
    event: MachinatEvent<Raw, Thread>,
    bot: MachinatBot<Raw, any, Rendered, Native, Job, Result, any, Thread>,
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
