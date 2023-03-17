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
import { WHATSAPP } from './constant';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import WhatsAppChat from './Chat';
import { createChatJobs, createUploadingMediaJobs } from './job';
import type {
  WhatsAppComponent,
  WhatsAppSegmentValue,
  WhatsAppDispatchFrame,
} from './types';

type WhatsAppBotOptions = {
  businessNumber: string;
  accessToken: string;
  appSecret?: string;
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    MetaApiJob,
    WhatsAppDispatchFrame,
    MetaApiResult
  >;
};

/**
 * WhatsAppBot render messages and make API call to WhatsApp platform.
 * @category Provider
 */
export class WhatsAppBot
  implements SociablyBot<WhatsAppChat, MetaApiJob, MetaApiResult>
{
  businessNumber: string;
  worker: MetaApiWorker;
  engine: Engine<
    WhatsAppChat,
    WhatsAppSegmentValue,
    WhatsAppComponent<unknown>,
    MetaApiJob,
    MetaApiResult
  >;

  platform = WHATSAPP;

  constructor({
    businessNumber,
    accessToken,
    appSecret,
    graphApiVersion = 'v11.0',
    apiBatchRequestInterval = 500,
    initScope,
    dispatchWrapper,
  }: WhatsAppBotOptions) {
    invariant(accessToken, 'options.accessToken should not be empty');
    invariant(businessNumber, 'options.businessNumber should not be empty');

    this.businessNumber = businessNumber;

    const renderer = new Renderer<
      WhatsAppSegmentValue,
      WhatsAppComponent<unknown>
    >(WHATSAPP, generalComponentDelegator);

    const queue = new Queue<MetaApiJob, MetaApiResult>();
    const worker = new MetaApiWorker(
      accessToken,
      apiBatchRequestInterval,
      graphApiVersion,
      appSecret
    );

    this.engine = new Engine(
      WHATSAPP,
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
    target: string | WhatsAppChat,
    messages: SociablyNode
  ): Promise<null | MetaApiDispatchResponse> {
    const thread =
      typeof target === 'string'
        ? new WhatsAppChat(this.businessNumber, target)
        : target;

    return this.engine.render(thread, messages, createChatJobs);
  }

  async uploadMedia(node: SociablyNode): Promise<null | { id: string }> {
    const response = await this.engine.render(
      null,
      node,
      createUploadingMediaJobs(this.businessNumber)
    );

    if (!response) {
      return null;
    }
    return response.results[0].body as { id: string };
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
    { businessNumber, accessToken, appSecret, apiBatchRequestInterval },
    moduleUitils,
    platformUtils
  ) =>
    new WhatsAppBot({
      businessNumber,
      accessToken,
      appSecret,
      apiBatchRequestInterval,
      initScope: moduleUitils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(WhatsAppBot);

type BotP = WhatsAppBot;
export default BotP;
