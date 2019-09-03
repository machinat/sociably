// @flow
import { compose } from 'machinat-utility';

import type {
  MachinatNode,
  MachinatNativeComponent,
  MachinatChannel,
  MachinatUser,
  MachinatEvent,
  MachinatMetadata,
} from 'machinat/types';
import type {
  MachinatBot,
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
  User: ?MachinatUser,
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
    User,
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
    User,
    Event,
    Metadata,
    Response,
    Native,
    SendOptions
  >[];

  constructor(
    platform: string,
    bot: MachinatBot<
      Channel,
      User,
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
      User,
      Event,
      Metadata,
      Response,
      Native,
      SendOptions
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
      EventFrame<
        Channel,
        User,
        Event,
        Metadata,
        any,
        any,
        any,
        any,
        SendOptions
      >
    ) => Response | Promise<Response>
  ): EventIssuer<Channel, User, Event, Metadata, Response> {
    const issue = compose(...this.eventMiddlewares)(async (...args) =>
      finalHandler(...args)
    );

    return (channel: Channel, user: User, event: Event, metadata: Metadata) => {
      const { bot } = this;

      const frame = {
        platform: this.platform,
        bot,
        channel,
        user,
        event,
        metadata,
        reply(nodes: MachinatNode, options: SendOptions) {
          return bot.render(channel, nodes, options);
        },
      };

      return issue(frame);
    };
  }
}
