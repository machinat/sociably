import type { MachinatBot, MachinatChannel, MachinatNode } from '../types';
import type { DispatchResponse } from '../engine/types';
import { makeInterface, makeClassProvider } from '../service';

const BotPlatformMapI = makeInterface<
  MachinatBot<MachinatChannel, unknown, unknown>
>({
  name: 'BotPlatformMap',
  polymorphic: true,
});

/**
 * @category Base
 */
export class BaseBot implements MachinatBot<MachinatChannel, unknown, unknown> {
  static PlatformMap = BotPlatformMapI;
  private _platformMapping: Map<
    string,
    MachinatBot<MachinatChannel, unknown, unknown>
  >;

  constructor(
    platformMapping: Map<string, MachinatBot<MachinatChannel, unknown, unknown>>
  ) {
    this._platformMapping = platformMapping;
  }

  async render(
    channel: MachinatChannel,
    node: MachinatNode
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

const BotP = makeClassProvider<
  MachinatBot<MachinatChannel, unknown, unknown>,
  [typeof BotPlatformMapI]
>({
  lifetime: 'transient',
  deps: [BotPlatformMapI],
})(BaseBot);

type BotP = BaseBot;

export default BotP;
