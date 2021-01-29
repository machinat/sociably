import type { MachinatBot, MachinatChannel, MachinatNode } from '../types';
import type { DispatchResponse } from '../engine/types';
import { makeInterface, makeClassProvider } from '../service';

const BotPlatformMap = makeInterface<
  MachinatBot<MachinatChannel, unknown, unknown>
>({
  name: 'BotPlatformMap',
  branched: true,
});

/**
 * @category Base
 */
export class BaseBot implements MachinatBot<MachinatChannel, unknown, unknown> {
  static PlatformMap = BotPlatformMap;
  private _branches: Map<
    string,
    MachinatBot<MachinatChannel, unknown, unknown>
  >;

  constructor(
    branches: Map<string, MachinatBot<MachinatChannel, unknown, unknown>>
  ) {
    this._branches = branches;
  }

  async render(
    channel: MachinatChannel,
    node: MachinatNode
  ): Promise<null | DispatchResponse<unknown, unknown>> {
    const bot = this._branches.get(channel.platform);
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
