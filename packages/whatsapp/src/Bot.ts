import invariant from 'invariant';
import type {
  SociablyNode,
  SociablyBot,
  InitScopeFn,
  DispatchWrapper,
} from '@sociably/core';
import Engine, { DispatchError } from '@sociably/core/engine';
import Queue from '@sociably/core/queue';
import Renderer from '@sociably/core/renderer';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import { serviceProviderClass } from '@sociably/core/service';
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
import WhatsAppAgent from './Agent';
import { createChatJobs, createUploadingMediaJobs } from './job';
import type {
  WhatsAppComponent,
  WhatsAppSegmentValue,
  WhatsAppDispatchFrame,
} from './types';

type WhatsAppBotOptions = {
  accessToken: string;
  appId: string;
  appSecret: string;
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    MetaApiJob,
    WhatsAppDispatchFrame,
    MetaApiResult
  >;
};

type ApiCallOptions = {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** API request URL relative to https://graph.facebook.com/{version}/ */
  url: string;
  /** API request parameters */
  params?: Record<string, unknown>;
};

/**
 * WhatsAppBot render messages and make API call to WhatsApp platform.
 * @category Provider
 */
export class WhatsAppBot
  implements SociablyBot<WhatsAppChat, MetaApiJob, MetaApiResult>
{
  worker: MetaApiWorker;
  engine: Engine<
    WhatsAppChat | WhatsAppAgent,
    WhatsAppSegmentValue,
    WhatsAppComponent<unknown>,
    MetaApiJob,
    MetaApiResult
  >;

  platform = WHATSAPP;

  constructor({
    accessToken,
    appId,
    appSecret,
    graphApiVersion = 'v11.0',
    apiBatchRequestInterval = 500,
    initScope,
    dispatchWrapper,
  }: WhatsAppBotOptions) {
    invariant(accessToken, 'options.accessToken should not be empty');

    const renderer = new Renderer<
      WhatsAppSegmentValue,
      WhatsAppComponent<unknown>
    >(WHATSAPP, generalComponentDelegator);

    const queue = new Queue<MetaApiJob, MetaApiResult>();
    const worker = new MetaApiWorker({
      appId,
      appSecret,
      graphApiVersion,
      consumeInterval: apiBatchRequestInterval,
      defaultAccessToken: accessToken,
    });

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
    thread: WhatsAppChat,
    messages: SociablyNode
  ): Promise<null | MetaApiDispatchResponse> {
    return this.engine.render(thread, messages, createChatJobs);
  }

  async uploadMedia(
    agentIdOrInstance: string | WhatsAppAgent,
    node: SociablyNode
  ): Promise<null | { id: string }> {
    const agent =
      typeof agentIdOrInstance === 'string'
        ? new WhatsAppAgent(agentIdOrInstance)
        : agentIdOrInstance;

    const response = await this.engine.render(
      agent,
      node,
      createUploadingMediaJobs
    );

    if (!response) {
      return null;
    }
    return response.results[0].body as { id: string };
  }

  async requestApi<ResBody extends MetaApiResponseBody>({
    method,
    url,
    params,
  }: ApiCallOptions): Promise<ResBody> {
    try {
      const { results } = await this.engine.dispatchJobs(null, [
        { request: { method, url, params } },
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

const BotP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [
    ConfigsI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    { accessToken, appId, appSecret, apiBatchRequestInterval },
    moduleUitils,
    platformUtils
  ) =>
    new WhatsAppBot({
      accessToken,
      appId,
      appSecret,
      apiBatchRequestInterval,
      initScope: moduleUitils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(WhatsAppBot);

type BotP = WhatsAppBot;
export default BotP;
