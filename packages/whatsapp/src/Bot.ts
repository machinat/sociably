import invariant from 'invariant';
import type {
  SociablyNode,
  SociablyBot,
  SociablyChannel,
  InitScopeFn,
  DispatchWrapper,
  ChannelSettingsAccessor,
} from '@sociably/core';
import Engine, { DispatchError } from '@sociably/core/engine';
import Queue from '@sociably/core/queue';
import Renderer from '@sociably/core/renderer';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import { makeClassProvider } from '@sociably/core/service';
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

const DUMMY_API_CALL_CHANNEL: SociablyChannel = {
  platform: WHATSAPP,
  uid: 'whatsapp:dummy_api_call_channel',
  uniqueIdentifier: {
    platform: WHATSAPP,
    id: 'dummy_api_call_channel',
  },
};

const createStaticSettingsAccessor = (
  accessToken: string
): ChannelSettingsAccessor<WhatsAppAgent, { accessToken: string }> => ({
  getChannelSettings: async () => ({ accessToken }),
  getChannelSettingsBatch: async (channels) =>
    channels.map(() => ({ accessToken })),
  listAllChannelSettings: async () => [{ accessToken }],
});

type ApiCallOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
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
    null | WhatsAppChat | WhatsAppAgent,
    WhatsAppSegmentValue,
    WhatsAppComponent<unknown>,
    MetaApiJob,
    MetaApiResult
  >;

  platform = WHATSAPP;

  constructor({
    accessToken,
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
    const worker = new MetaApiWorker(
      createStaticSettingsAccessor(accessToken),
      appSecret,
      graphApiVersion,
      apiBatchRequestInterval
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
    thread: WhatsAppChat,
    messages: SociablyNode
  ): Promise<null | MetaApiDispatchResponse> {
    return this.engine.render(thread, messages, createChatJobs);
  }

  async uploadMedia(
    agent: WhatsAppAgent,
    node: SociablyNode
  ): Promise<null | { id: string }> {
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

  async makeApiCall<ResBody extends MetaApiResponseBody>({
    method,
    path,
    params,
  }: ApiCallOptions): Promise<ResBody> {
    try {
      const { results } = await this.engine.dispatchJobs(null, [
        {
          channel: DUMMY_API_CALL_CHANNEL,
          request: {
            method,
            relativeUrl: path,
            params,
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
    { accessToken, appSecret, apiBatchRequestInterval },
    moduleUitils,
    platformUtils
  ) =>
    new WhatsAppBot({
      accessToken,
      appSecret,
      apiBatchRequestInterval,
      initScope: moduleUitils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(WhatsAppBot);

type BotP = WhatsAppBot;
export default BotP;
