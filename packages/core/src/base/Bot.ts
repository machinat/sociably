import type { SociablyBot, SociablyThread, SociablyNode } from '../types.js';
import type { DispatchResponse } from '../engine/types.js';
import { serviceInterface, serviceProviderClass } from '../service/index.js';

type BaseBotI = SociablyBot<SociablyThread, unknown, unknown>;

const BotPlatformMapI = serviceInterface<BaseBotI>({
  name: 'BotPlatformMap',
  polymorphic: true,
});

/**
 * @category Base
 */
export class BaseBot implements BaseBotI {
  static PlatformMap = BotPlatformMapI;

  private _platformMapping: Map<string, BaseBotI>;

  constructor(platformMapping: Map<string, BaseBotI>) {
    this._platformMapping = platformMapping;
  }

  async render(
    thread: SociablyThread,
    node: SociablyNode
  ): Promise<null | DispatchResponse<unknown, unknown>> {
    const bot = this._platformMapping.get(thread.platform);
    if (!bot) {
      throw new TypeError(
        `thread of platform '${thread.platform}' is not supported`
      );
    }

    return bot.render(thread, node);
  }

  async start(): Promise<void> {} // eslint-disable-line class-methods-use-this
  async stop(): Promise<void> {} // eslint-disable-line class-methods-use-this
}

const BotP = serviceProviderClass({
  lifetime: 'transient',
  deps: [BotPlatformMapI],
})(BaseBot);

type BotP = BaseBot;

export default BotP;
