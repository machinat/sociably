// @flow
import invariant from 'invariant';
import { Emitter, Controller, resolvePlugins } from 'machinat-base';
import type { HTTPRequestReceivable } from 'machinat-http-adaptor/types';
import type { MachinatBot } from 'machinat-base/types';
import NextReceiver from './receiver';
import type {
  NextChannel,
  NextEvent,
  NextMetadata,
  NextResponse,
  NextBotOptions,
} from './types';

const NEXT = 'next';

class NextServerBot
  extends Emitter<
    NextChannel,
    null,
    NextEvent,
    NextMetadata,
    void,
    any,
    void,
    void,
    void
  >
  implements
    HTTPRequestReceivable<NextReceiver>,
    MachinatBot<
      NextChannel,
      null,
      NextEvent,
      NextMetadata,
      NextResponse,
      void,
      any,
      void,
      void,
      void,
      NextBotOptions
    > {
  receiver: NextReceiver;
  controller: Controller<
    NextChannel,
    null,
    NextEvent,
    NextMetadata,
    NextResponse,
    void,
    any,
    void
  >;

  constructor({
    nextApp,
    basePath,
    plugins,
    shouldPrepare = true,
  }: NextBotOptions = {}) {
    super();

    invariant(nextApp, 'options.nextApp should not be empty');

    this.receiver = new NextReceiver(nextApp, shouldPrepare, basePath);

    const { eventMiddlewares } = resolvePlugins(this, plugins);
    this.controller = new Controller(NEXT, this, eventMiddlewares);

    const issueEvent = this.controller.eventIssuerThroughMiddlewares(frame => {
      const { payload } = frame.event;

      frame.event.payload = {
        ...payload,
        req: undefined,
        res: undefined,
      };

      this.emitEvent(frame);

      return { accepted: true };
    });

    this.receiver.bindIssuer(issueEvent, this.emitError.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    throw new Error('cannot call render() on NextBot');
  }
}

export default NextServerBot;
