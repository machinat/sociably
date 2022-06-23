import type { SociablyBot, SociablyChannel, SociablyNode } from '../types';
import type { DispatchResponse } from '../engine/types';
import { makeInterface, makeClassProvider } from '../service';

const BotPlatformMapI = makeInterface<
  SociablyBot<SociablyChannel, unknown, unknown>
>({
  name: 'BotPlatformMap',
  polymorphic: true,
});

/**
 * @category Base
 */
export class BasicBot
  implements SociablyBot<SociablyChannel, unknown, unknown>
{
  static PlatformMap = BotPlatformMapI;
  private _platformMapping: Map<
    string,
    SociablyBot<SociablyChannel, unknown, unknown>
  >;

  constructor(
    platformMapping: Map<string, SociablyBot<SociablyChannel, unknown, unknown>>
  ) {
    this._platformMapping = platformMapping;
  }

  async render(
    channel: SociablyChannel,
    node: SociablyNode
  ): Promise<null | DispatchResponse<unknown, unknown>> {
    const bot = this._platformMapping.get(channel.platform);
    if (!bot) {
      throw new TypeError(
        `channel of platform '${channel.platform}' is not supported`
      );
    }

    return bot.render(channel, node);
  }

  async start(): Promise<void> {} // eslint-disable-line class-methods-use-this
  async stop(): Promise<void> {} // eslint-disable-line class-methods-use-this
}

const BotP = makeClassProvider({
  lifetime: 'transient',
  deps: [BotPlatformMapI],
})(BasicBot);

type BotP = BasicBot;

export default BotP;
