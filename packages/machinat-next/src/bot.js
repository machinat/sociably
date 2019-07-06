// @flow
import invariant from 'invariant';
import { Emitter, Controller, resolvePlugins } from 'machinat-base';
import type { HTTPRequestReceivable } from 'machinat-http-adaptor/types';
import type { MachinatBot, BotPlugin } from 'machinat-base/types';
import NextReceiver from './receiver';
import type { NextChannel } from './receiver';
import type { NextEvent, NextMetadata, NextParams } from './types';

const NEXT = 'next';

type NextPlugin = BotPlugin<
  NextChannel,
  NextEvent,
  NextMetadata,
  NextParams,
  void,
  any,
  void,
  void
>;

type NextBotOptions = {|
  nextApp: any,
  plugins?: NextPlugin[],
|};

class NextServerBot
  extends Emitter<NextChannel, NextEvent, NextMetadata, void, any, void, void>
  implements
    HTTPRequestReceivable<NextReceiver>,
    MachinatBot<
      NextChannel,
      NextEvent,
      NextMetadata,
      NextParams,
      void,
      any,
      void,
      void,
      NextBotOptions,
      void
    > {
  receiver: NextReceiver;
  controller: Controller<
    NextChannel,
    NextEvent,
    NextMetadata,
    NextParams,
    void,
    any
  >;

  constructor(options: NextBotOptions) {
    super();

    invariant(
      options && options.nextApp,
      'options.nextApp should not be empty'
    );

    this.receiver = new NextReceiver(options.nextApp);

    const { eventMiddlewares } = resolvePlugins(this, options.plugins);
    this.controller = new Controller(NEXT, this, eventMiddlewares);

    const issueEvent = this.controller.eventIssuerThroughMiddlewares(frame => {
      this.emitEvent(frame);
      return frame.event.payload;
    });

    this.receiver.bindIssuer(issueEvent, this.emitError.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  send() {
    throw new Error("can't call send() on next server bot");
  }
}

export default NextServerBot;
