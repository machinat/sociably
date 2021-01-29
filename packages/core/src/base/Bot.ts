import type { MachinatBot, MachinatChannel, MachinatNode } from '../types';
import type { DispatchResponse } from '../engine/types';
import { makeInterface, makeClassProvider } from '../service';

const BotPlatformMap = makeInterface<
  MachinatBot<MachinatChannel, unknown, unknown>
>({
  name: 'BotPlatformMap',
  polymorphic: true,
});

/**
 * @category Base
 */
export class BaseBot implements MachinatBot<MachinatChannel, unknown, unknown> {
  static PlatformMap = BotPlatformMap;
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

export const BotP = makeClassProvider({
  lifetime: 'transient',
  deps: [BotPlatformMap] as const,
})(BaseBot);

export type BotP = BaseBot;
