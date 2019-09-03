// @flow
import type {
  MachinatNativeComponent,
  MachinatChannel,
  MachinatUser,
  MachinatEvent,
  MachinatMetadata,
} from 'machinat/types';
import type {
  MachinatBot,
  BotPlugin,
  EventMiddleware,
  DispatchMiddleware,
} from './types';

const resolvePlugins = <
  Channel: MachinatChannel,
  User: ?MachinatUser,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result,
  SendOptions,
  Bot: MachinatBot<
    Channel,
    User,
    Event,
    Metadata,
    Response,
    SegmentValue,
    Native,
    Job,
    Result,
    SendOptions,
    any
  >
>(
  bot: Bot,
  plugins: ?Array<
    BotPlugin<
      Channel,
      User,
      Event,
      Metadata,
      Response,
      SegmentValue,
      Native,
      Job,
      Result,
      SendOptions,
      Bot
    >
  >
): {|
  eventMiddlewares: EventMiddleware<
    Channel,
    User,
    Event,
    Metadata,
    Response,
    Native,
    SendOptions
  >[],
  dispatchMiddlewares: DispatchMiddleware<Channel, Job, Result>[],
|} => {
  const eventMiddlewares = [];
  const dispatchMiddlewares = [];

  if (plugins) {
    for (const plugin of plugins) {
      const resolved = plugin(bot);

      if (resolved) {
        const { dispatchMiddleware, eventMiddleware } = resolved;

        if (eventMiddleware) eventMiddlewares.push(eventMiddleware);
        if (dispatchMiddleware) dispatchMiddlewares.push(dispatchMiddleware);
      }
    }
  }

  return { eventMiddlewares, dispatchMiddlewares };
};

export default resolvePlugins;
