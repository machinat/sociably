// @flow
import { compose } from 'machinat-utility';

import type { MachinatNode, MachinatNativeComponent } from 'machinat/types';
import type {
  MachinatBot,
  MachinatChannel,
  MachinatEvent,
  MachinatMetadata,
  EventFrame,
  EventIssuer,
  EventMiddleware,
} from './types';

import { validateMiddlewares } from './utils';

// MachinatController controls event logic flow and the data framing within
// machinat framework. When event flow in, controller construct EventFrame and
// pass it throught event middlewares then publish it.
export default class MachinatController<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  SendOptions
> {
  platform: string;
  bot: MachinatBot<
    Channel,
    Event,
    Metadata,
    Response,
    SegmentValue,
    Native,
    any,
    any,
    any,
    any
  >;

  eventMiddlewares: EventMiddleware<
    Channel,
    Event,
    Metadata,
    Response,
    Native
  >[];

  constructor(
    platform: string,
    bot: MachinatBot<
      Channel,
      Event,
      Metadata,
      Response,
      SegmentValue,
      Native,
      any,
      any,
      any,
      any
    >,

    eventMiddlewares: EventMiddleware<
      Channel,
      Event,
      Metadata,
      Response,
      Native
    >[]
  ) {
    this.platform = platform;
    this.bot = bot;

    validateMiddlewares(eventMiddlewares);

    this.eventMiddlewares = eventMiddlewares;
  }

  // eventIssuerThroughMiddlewares create the event issuing function which
  // construct event frame and pass it through event middlewares in order. The
  // finalHandler is called as the last middleware then return the response
  // poped out of the middlewares stack one be one. For most of time you pass
  // the issuer fn created directly to the receiver.
  eventIssuerThroughMiddlewares(
    finalHandler: (
      EventFrame<Channel, Event, Metadata, any, any, any, any>
    ) => Response | Promise<Response>
  ): EventIssuer<Channel, Event, Metadata, Response> {
    const issue = compose(...this.eventMiddlewares)(async (...args) =>
      finalHandler(...args)
    );

    return (channel: Channel, event: Event, metadata: Metadata) => {
      const { bot } = this;

      const frame = {
        platform: this.platform,
        bot,
        channel,
        event,
        metadata,
        reply(nodes: MachinatNode, options: SendOptions) {
          return bot.send(channel, nodes, options);
        },
      };

      return issue(frame);
    };
  }
}
