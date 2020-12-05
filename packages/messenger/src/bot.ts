import invariant from 'invariant';
import Engine from '@machinat/core/engine';
import type { DispatchResponse } from '@machinat/core/engine/types';
import Queue from '@machinat/core/queue';
import Renderer from '@machinat/core/renderer';
import { provider, createEmptyScope } from '@machinat/core/service';

import type {
  MachinatNode,
  MachinatBot,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core/types';

import MessengerWorker from './worker';
import generalComponentDelegator from './components/general';

import { MESSENGER } from './constant';
import { PLATFORM_CONFIGS_I, PLATFORM_MOUNTER_I } from './interface';
import MessengerChannel from './channel';
import { chatJobsMaker, makeAttachmentJobs } from './job';

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
  pageId: string;
  accessToken: string;
  appSecret?: string;
  consumeInterval?: number;
};

/**
 * MessengerBot render messages and make API call to Messenger platform.
 * @category Provider
 */
export class MessengerBot
  implements MachinatBot<MessengerChannel, MessengerJob, MessengerResult> {
  pageId: string;
  worker: MessengerWorker;
  engine: Engine<
    MessengerChannel,
    MessengerSegmentValue,
    MessengerComponent<any>,
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
    }: MessengerBotOptions = {} as any,
    initScope: InitScopeFn = () => createEmptyScope(MESSENGER),
    dispatchWrapper: DispatchWrapper<
      MessengerJob,
      MessengerDispatchFrame,
      MessengerResult
    > = (dispatch) => dispatch
  ) {
    invariant(pageId, 'options.pageId should not be empty');
    this.pageId = pageId;

    invariant(accessToken, 'options.accessToken should not be empty');

    const renderer = new Renderer<
      MessengerSegmentValue,
      MessengerComponent<any>
    >(MESSENGER, generalComponentDelegator);

    const queue = new Queue<MessengerJob, MessengerResult>();
    const worker = new MessengerWorker(accessToken, consumeInterval, appSecret);

    this.engine = new Engine(
      MESSENGER,
      this,
      renderer,
      queue,
      worker,
      initScope,
      dispatchWrapper
    );
  }

  async start(): Promise<void> {
    this.engine.start();
  }

  async stop(): Promise<void> {
    this.engine.stop();
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

  async dispatchAPICall(
    method: 'GET' | 'POST' | 'DELETE',
    relativeURL: string,
    body?: null | any
  ): Promise<MessengerResult> {
    const {
      results: [result],
    } = await this.engine.dispatchJobs(null, [
      {
        request: {
          method,
          relative_url: relativeURL,
          body,
        },
      },
    ]);
    return result;
  }
}

export const BotP = provider<MessengerBot>({
  lifetime: 'singleton',
  deps: [PLATFORM_CONFIGS_I, { require: PLATFORM_MOUNTER_I, optional: true }],
  factory: (
    configs: MessengerPlatformConfigs,
    mounter: null | MessengerPlatformMounter
  ) => new MessengerBot(configs, mounter?.initScope, mounter?.dispatchWrapper),
})(MessengerBot);

export type BotP = MessengerBot;
