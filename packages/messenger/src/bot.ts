import invariant from 'invariant';
import Engine, { DispatchError } from '@machinat/core/engine';
import Queue from '@machinat/core/queue';
import Renderer from '@machinat/core/renderer';
import ModuleUtilitiesI from '@machinat/core/base/ModuleUtilities';
import { makeClassProvider, createEmptyScope } from '@machinat/core/service';
import type {
  MachinatNode,
  MachinatBot,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core';

import MessengerWorker from './worker';
import generalComponentDelegator from './components/general';
import { MESSENGER } from './constant';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import MessengerChannel from './channel';
import { createChatJobs, createAttachmentJobs } from './job';
import type {
  MessengerTarget,
  MessengerComponent,
  MessengerJob,
  MessengerResult,
  MessengerSegmentValue,
  MessengerDispatchFrame,
  MessengerDispatchResponse,
  MessengerSendOptions,
  FbGraphApiResult,
} from './types';

type MessengerBotOptions = {
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    MessengerJob,
    MessengerDispatchFrame,
    MessengerResult
  >;
  pageId: number;
  accessToken: string;
  appSecret?: string;
  graphApiVersion?: string;
  consumeInterval?: number;
};

/**
 * MessengerBot render messages and make API call to Messenger platform.
 * @category Provider
 */
export class MessengerBot
  implements MachinatBot<MessengerChannel, MessengerJob, MessengerResult>
{
  pageId: number;
  worker: MessengerWorker;
  engine: Engine<
    MessengerChannel,
    MessengerSegmentValue,
    MessengerComponent<unknown>,
    MessengerJob,
    MessengerResult,
    MessengerBot
  >;

  constructor({
    pageId,
    accessToken,
    appSecret,
    graphApiVersion = 'v11.0',
    consumeInterval = 500,
    initScope = () => createEmptyScope(),
    dispatchWrapper = (dispatch) => dispatch,
  }: MessengerBotOptions) {
    invariant(pageId, 'options.pageId should not be empty');
    this.pageId = pageId;

    invariant(accessToken, 'options.accessToken should not be empty');

    const renderer = new Renderer<
      MessengerSegmentValue,
      MessengerComponent<any>
    >(MESSENGER, generalComponentDelegator);

    const queue = new Queue<MessengerJob, MessengerResult>();
    const worker = new MessengerWorker(
      accessToken,
      consumeInterval,
      graphApiVersion,
      appSecret
    );

    this.engine = new Engine(
      MESSENGER,
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
  ): Promise<null | MessengerDispatchResponse> {
    const channel =
      target instanceof MessengerChannel
        ? target
        : new MessengerChannel(
            this.pageId,
            typeof target === 'string' ? { id: target } : target
          );

    return this.engine.render(channel, messages, createChatJobs(options));
  }

  async renderAttachment(
    node: MachinatNode
  ): Promise<null | MessengerDispatchResponse> {
    return this.engine.render(null, node, createAttachmentJobs);
  }

  async makeApiCall<ResBody extends FbGraphApiResult>(
    method: 'GET' | 'POST' | 'DELETE',
    relativeUrl: string,
    body?: null | unknown
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
    ConfigsI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ] as const,
  factory: (
    { pageId, accessToken, appSecret, consumeInterval },
    moduleUitils,
    platformUtils
  ) =>
    new MessengerBot({
      pageId,
      accessToken,
      appSecret,
      consumeInterval,
      initScope: moduleUitils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(MessengerBot);

export type BotP = MessengerBot;
