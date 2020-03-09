// @flow
import invariant from 'invariant';

import Engine from '@machinat/core/engine';
import type { DispatchResponse } from '@machinat/core/engine/types';
import Queue from '@machinat/core/queue';
import Renderer from '@machinat/core/renderer';
import { provider } from '@machinat/core/service';

import type {
  MachinatNode,
  MachinatBot,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core/types';

import MessengerWorker from './worker';
import generalComponentDelegate from './component/general';

import {
  MESSENGER,
  MESSENGER_PLATFORM_CONFIGS_I,
  MESSENGER_PLATFORM_MOUNTER_I,
} from './constant';
import MessengerChannel from './channel';
import { chatJobsMaker, makeCreativeJobs, makeAttachmentJobs } from './job';

import type {
  MessengerTarget,
  MessengerComponent,
  MessengerJob,
  MessengerResult,
  MessengerSegmentValue,
  MessengerDispatchFrame,
  MessengerSendOptions,
  MessengerPlatformConfigs,
  MessengerPlatformMounter,
} from './types';

type MessengerBotOptions = {
  pageId: string,
  accessToken: string,
  appSecret?: string,
  consumeInterval?: number,
};

class MessengerBot
  implements MachinatBot<MessengerChannel, MessengerJob, MessengerResult> {
  pageId: string;
  worker: MessengerWorker;
  engine: Engine<
    MessengerChannel,
    MessengerSegmentValue,
    MessengerComponent,
    MessengerJob,
    MessengerResult,
    MessengerBot
  >;

  constructor(
    {
      pageId,
      accessToken,
      appSecret,
      consumeInterval = 500,
    }: MessengerBotOptions = {},
    initScope?: InitScopeFn,
    dispatchWrapper?: DispatchWrapper<
      MessengerJob,
      MessengerDispatchFrame,
      MessengerResult
    >
  ) {
    invariant(pageId, 'options.pageId should not be empty');
    this.pageId = pageId;

    invariant(accessToken, 'options.accessToken should not be empty');

    const renderer = new Renderer(MESSENGER, generalComponentDelegate);

    const queue = new Queue();
    const worker = new MessengerWorker(accessToken, consumeInterval, appSecret);

    this.engine = new Engine(
      MESSENGER,
      this,
      renderer,
      queue,
      worker,
      initScope || null,
      dispatchWrapper || null
    );
  }

  start(): MessengerBot {
    this.engine.start();
    return this;
  }

  stop(): MessengerBot {
    this.engine.stop();
    return this;
  }

  async render(
    target: string | MessengerTarget | MessengerChannel,
    messages: MachinatNode,
    options?: MessengerSendOptions
  ): Promise<null | DispatchResponse<MessengerJob, MessengerResult>> {
    const channel =
      target instanceof MessengerChannel
        ? target
        : new MessengerChannel(
            this.pageId,
            typeof target === 'string' ? { id: target } : target
          );

    return this.engine.render(channel, messages, chatJobsMaker(options));
  }

  async renderAttachment(
    node: MachinatNode
  ): Promise<null | DispatchResponse<MessengerJob, MessengerResult>> {
    return this.engine.render(null, node, makeAttachmentJobs);
  }

  renderMessageCreative(
    node: MachinatNode
  ): Promise<null | DispatchResponse<MessengerJob, MessengerResult>> {
    return this.engine.render(null, node, makeCreativeJobs);
  }

  dispatchAPICall(
    method: 'GET' | 'POST' | 'DELETE',
    relativeURL: string,
    body?: Object
  ): Promise<null | DispatchResponse<MessengerJob, MessengerResult>> {
    return this.engine.dispatchJobs(null, [
      {
        request: {
          method,
          relative_url: relativeURL,
          body,
        },
      },
    ]);
  }
}

export default provider<MessengerBot>({
  lifetime: 'singleton',
  deps: [MESSENGER_PLATFORM_CONFIGS_I, MESSENGER_PLATFORM_MOUNTER_I],
  factory: (
    configs: MessengerPlatformConfigs,
    { initScope, dispatchWrapper }: MessengerPlatformMounter
  ) => new MessengerBot(configs, initScope, dispatchWrapper),
})(MessengerBot);
