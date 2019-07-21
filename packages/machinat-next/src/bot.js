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
  NextPesponse,
  NextBotOptions,
} from './types';

const NEXT = 'next';

class NextServerBot
  extends Emitter<
    NextChannel,
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
      NextEvent,
      NextMetadata,
      NextPesponse,
      void,
      any,
      void,
      void,
      void,
      NextBotOptions
    > {
  options: NextBotOptions;
  receiver: NextReceiver;
  controller: Controller<
    NextChannel,
    NextEvent,
    NextMetadata,
    NextPesponse,
    void,
    any,
    void
  >;

  constructor(optionsInput?: NextBotOptions) {
    super();

    invariant(
      optionsInput && optionsInput.nextApp,
      'options.nextApp should not be empty'
    );

    this.options = optionsInput;
    this.receiver = new NextReceiver(this.options);

    const { eventMiddlewares } = resolvePlugins(this, this.options.plugins);
    this.controller = new Controller(NEXT, this, eventMiddlewares);

    const issueEvent = this.controller.eventIssuerThroughMiddlewares(frame => {
      const { payload } = frame.event;

      frame.event.payload = {
        ...payload,
        req: undefined,
        res: undefined,
      };

      this.emitEvent(frame);
    });

    this.receiver.bindIssuer(issueEvent, this.emitError.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    throw new Error('cannot call render() on NextBot');
  }
}

export default NextServerBot;
