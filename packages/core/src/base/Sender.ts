import type { SociablySender, SociablyThread, SociablyNode } from '../types.js';
import type { DispatchResponse } from '../engine/types.js';
import { serviceInterface, serviceProviderClass } from '../service/index.js';

type BaseSenderI = SociablySender<SociablyThread, unknown, unknown>;

const SenderPlatformMapI = serviceInterface<BaseSenderI>({
  name: 'SenderPlatformMap',
  polymorphic: true,
});

/** @category Base */
export class BaseSender implements BaseSenderI {
  static PlatformMap = SenderPlatformMapI;

  private _platformMapping: Map<string, BaseSenderI>;

  constructor(platformMapping: Map<string, BaseSenderI>) {
    this._platformMapping = platformMapping;
  }

  async render(
    thread: SociablyThread,
    node: SociablyNode,
  ): Promise<null | DispatchResponse<unknown, unknown>> {
    const sender = this._platformMapping.get(thread.platform);
    if (!sender) {
      throw new TypeError(
        `thread of platform '${thread.platform}' is not supported`,
      );
    }

    return sender.render(thread, node);
  }

  async start(): Promise<void> {} // eslint-disable-line class-methods-use-this
  async stop(): Promise<void> {} // eslint-disable-line class-methods-use-this
}

const SenderP = serviceProviderClass({
  lifetime: 'transient',
  deps: [SenderPlatformMapI],
})(BaseSender);

type SenderP = BaseSender;

export default SenderP;
