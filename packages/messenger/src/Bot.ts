import invariant from 'invariant';
import Engine, { DispatchError } from '@sociably/core/engine';
import Queue from '@sociably/core/queue';
import Renderer from '@sociably/core/renderer';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import { makeClassProvider } from '@sociably/core/service';
import type {
  SociablyNode,
  SociablyBot,
  InitScopeFn,
  DispatchWrapper,
} from '@sociably/core';
import {
  MetaApiWorker,
  MetaApiJob,
  MetaApiResult,
  MetaApiDispatchResponse,
  MetaApiResponseBody,
} from '@sociably/meta-api';
import generalComponentDelegator from './components/general';
import { MESSENGER } from './constant';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import MessengerChat from './Chat';
import SendTarget from './SendTarget';
import { createChatJobs, createAttachmentJobs } from './job';
import type {
  MessengerChannel,
  MessengerTarget,
  MessengerComponent,
  MessengerSegmentValue,
  MessengerDispatchFrame,
  MessengerSendOptions,
} from './types';

type MessengerBotOptions = {
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    MetaApiJob,
    MessengerDispatchFrame,
    MetaApiResult
  >;
  pageId: string;
  accessToken: string;
  appSecret?: string;
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
};

/**
 * MessengerBot render messages and make API call to Messenger platform.
 * @category Provider
 */
export class MessengerBot
  implements SociablyBot<MessengerChannel, MetaApiJob, MetaApiResult>
{
  pageId: string;
  worker: MetaApiWorker;
  engine: Engine<
    MessengerChannel,
    MessengerSegmentValue,
    MessengerComponent<unknown>,
    MetaApiJob,
    MetaApiResult
  >;

  platform = MESSENGER;

  constructor({
    pageId,
    accessToken,
    appSecret,
    graphApiVersion = 'v11.0',
    apiBatchRequestInterval = 500,
    initScope,
    dispatchWrapper,
  }: MessengerBotOptions) {
    invariant(pageId, 'options.pageId should not be empty');
    this.pageId = pageId;

    invariant(accessToken, 'options.accessToken should not be empty');

    const renderer = new Renderer<
      MessengerSegmentValue,
      MessengerComponent<unknown>
    >(MESSENGER, generalComponentDelegator);

    const queue = new Queue<MetaApiJob, MetaApiResult>();
    const worker = new MetaApiWorker(
      accessToken,
      apiBatchRequestInterval,
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
    messages: SociablyNode,
    options?: MessengerSendOptions
  ): Promise<null | MetaApiDispatchResponse> {
    const channel =
      typeof target === 'string'
        ? new MessengerChat(this.pageId, target)
        : target instanceof MessengerChat || target instanceof SendTarget
        ? target
        : new SendTarget(this.pageId, target);

    return this.engine.render(channel, messages, createChatJobs(options));
  }

  async renderAttachment(
    node: SociablyNode
  ): Promise<null | MetaApiDispatchResponse> {
    return this.engine.render(null, node, createAttachmentJobs);
  }

  async makeApiCall<ResBody extends MetaApiResponseBody>(
    method: 'GET' | 'PUT' | 'POST' | 'DELETE',
    relativeUrl: string,
    body: null | Record<string, unknown> = null
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

const BotP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    ConfigsI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    { pageId, accessToken, appSecret, apiBatchRequestInterval },
    moduleUitils,
    platformUtils
  ) =>
    new MessengerBot({
      pageId,
      accessToken,
      appSecret,
      apiBatchRequestInterval,
      initScope: moduleUitils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(MessengerBot);

type BotP = MessengerBot;
export default BotP;
