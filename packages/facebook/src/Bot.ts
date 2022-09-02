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
import { FACEBOOK } from './constant';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import FacebookChat from './Chat';
import { createChatJobs, createAttachmentJobs } from './job';
import type {
  FacebookChannel,
  MessagingTarget,
  FacebookComponent,
  FacebookSegmentValue,
  FacebookDispatchFrame,
  MessagingOptions,
} from './types';

type FacebookBotOptions = {
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    MetaApiJob,
    FacebookDispatchFrame,
    MetaApiResult
  >;
  pageId: string;
  accessToken: string;
  appSecret?: string;
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
};

/**
 * FacebookBot render messages and make API call to Facebook platform.
 * @category Provider
 */
export class FacebookBot
  implements SociablyBot<FacebookChannel, MetaApiJob, MetaApiResult>
{
  pageId: string;
  worker: MetaApiWorker;
  engine: Engine<
    FacebookChannel,
    FacebookSegmentValue,
    FacebookComponent<unknown>,
    MetaApiJob,
    MetaApiResult
  >;

  platform = FACEBOOK;

  constructor({
    pageId,
    accessToken,
    appSecret,
    graphApiVersion = 'v11.0',
    apiBatchRequestInterval = 500,
    initScope,
    dispatchWrapper,
  }: FacebookBotOptions) {
    invariant(pageId, 'options.pageId should not be empty');
    this.pageId = pageId;

    invariant(accessToken, 'options.accessToken should not be empty');

    const renderer = new Renderer<
      FacebookSegmentValue,
      FacebookComponent<unknown>
    >(FACEBOOK, generalComponentDelegator);

    const queue = new Queue<MetaApiJob, MetaApiResult>();
    const worker = new MetaApiWorker(
      accessToken,
      apiBatchRequestInterval,
      graphApiVersion,
      appSecret
    );

    this.engine = new Engine(
      FACEBOOK,
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
    target: string | MessagingTarget | FacebookChannel,
    messages: SociablyNode,
    options?: MessagingOptions
  ): Promise<null | MetaApiDispatchResponse> {
    const channel =
      typeof target === 'string'
        ? new FacebookChat(this.pageId, { id: target })
        : target instanceof FacebookChat
        ? target
        : new FacebookChat(this.pageId, target);

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
    new FacebookBot({
      pageId,
      accessToken,
      appSecret,
      apiBatchRequestInterval,
      initScope: moduleUitils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(FacebookBot);

type BotP = FacebookBot;
export default BotP;
