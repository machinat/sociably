// @flow
import type { MachinatNativeComponent } from 'machinat/types';
import type {
  MachinatBot,
  BotPlugin,
  EventMiddleware,
  DispatchMiddleware,
  MachinatChannel,
  MachinatEvent,
  MachinatMetadata,
} from './types';

const resolvePlugins = <
  Channel: MachinatChannel,
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
