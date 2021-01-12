import invariant from 'invariant';
import Engine, { DispatchError } from '@machinat/core/engine';
import type { DispatchResponse } from '@machinat/core/engine/types';
import Queue from '@machinat/core/queue';
import Renderer from '@machinat/core/renderer';
import { makeClassProvider, createEmptyScope } from '@machinat/core/service';

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
  FbGraphApiResult,
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
    MessengerComponent<unknown>,
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
    }: MessengerBotOptions,
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

  async makeApiCall<ResBody extends FbGraphApiResult>(
    method: 'GET' | 'POST' | 'DELETE',
    relativeUrl: string,
    body?: null | any
  ): Promise<ResBody> {
    try {
      const { results } = await this.engine.dispatchJobs(null, [
        {
          request: {
            method,
            relative_url: relativeUrl,
            body,
          },
        },
      ]);

      return results[0].body as ResBody;
    } catch (err) {
      if (err instanceof DispatchError) {
        throw err.errors[0];
      }
      throw err;
    }
  }
}

export const BotP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    PLATFORM_CONFIGS_I,
    { require: PLATFORM_MOUNTER_I, optional: true },
  ] as const,
  factory: (configs, mounter) =>
    new MessengerBot(configs, mounter?.initScope, mounter?.dispatchWrapper),
})(MessengerBot);

export type BotP = MessengerBot;
