import type { SociablyBot, SociablyThread, SociablyNode } from '../types';
import type { DispatchResponse } from '../engine/types';
import { makeInterface, makeClassProvider } from '../service';

const BotPlatformMapI = makeInterface<
  SociablyBot<SociablyThread, unknown, unknown>
>({
  name: 'BotPlatformMap',
  polymorphic: true,
});

/**
 * @category Base
 */
export class BasicBot implements SociablyBot<SociablyThread, unknown, unknown> {
  static PlatformMap = BotPlatformMapI;
  private _platformMapping: Map<
    string,
    SociablyBot<SociablyThread, unknown, unknown>
  >;

  constructor(
    platformMapping: Map<string, SociablyBot<SociablyThread, unknown, unknown>>
  ) {
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

const BotP = makeClassProvider({
  lifetime: 'transient',
  deps: [BotPlatformMapI],
})(BasicBot);

type BotP = BasicBot;

export default BotP;
