import { AgentSettingsAccessor } from '@sociably/core';
import Engine, { DispatchError } from '@sociably/core/engine';
import Queue from '@sociably/core/queue';
import Renderer from '@sociably/core/renderer';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import { serviceProviderClass } from '@sociably/core/service';
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
import { createChatJobs, createChatAttachmentJobs } from '@sociably/messenger';
import { renderGeneralComponents } from '@sociably/messenger/components';
import { INSTAGRAM } from './constant.js';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import InstagramPage from './Page.js';
import InstagramChat from './Chat.js';
import type {
  InstagramComponent,
  InstagramSegmentValue,
  InstagramDispatchFrame,
  InstagramMessagingOptions,
  InstagramAgentSettings,
  InstagramThread,
} from './types.js';

type InstagramBotOptions = {
  appId: string;
  appSecret: string;
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
  agentSettingsAccessor: AgentSettingsAccessor<
    InstagramPage,
    InstagramAgentSettings
  >;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    MetaApiJob,
    InstagramDispatchFrame,
    MetaApiResult
  >;
};

type UploadAttachmentResult = {
  attachmentId: string;
};

type ApiCallOptions = {
  /** The page to make the API call */
  page?: string | InstagramPage;
  /** HTTP method */
  method?: string;
  /** API request URL relative to https://graph.facebook.com/{version}/ */
  url: string;
  /** API request parameters */
  params?: Record<string, unknown>;
  /** Make the API call as the Meta app */
  asApp?: boolean;
  /** Force to use the access token */
  accessToken?: string;
};

/**
 * InstagramBot render messages and make API call to Instagram platform.
 * @category Provider
 */
export class InstagramBot
  implements SociablyBot<InstagramChat, MetaApiJob, MetaApiResult>
{
  worker: MetaApiWorker;
  engine: Engine<
    InstagramThread,
    InstagramSegmentValue,
    InstagramComponent<unknown>,
    MetaApiJob,
    MetaApiResult
  >;

  platform = INSTAGRAM;

  constructor({
    appId,
    appSecret,
    graphApiVersion = 'v11.0',
    apiBatchRequestInterval = 500,
    agentSettingsAccessor,
    initScope,
    dispatchWrapper,
  }: InstagramBotOptions) {
    const renderer = new Renderer<
      InstagramSegmentValue,
      InstagramComponent<unknown>
    >(INSTAGRAM, renderGeneralComponents);

    const queue = new Queue<MetaApiJob, MetaApiResult>();
    const worker = new MetaApiWorker({
      agentSettingsAccessor,
      appId,
      appSecret,
      graphApiVersion,
      consumeInterval: apiBatchRequestInterval,
    });

    this.engine = new Engine(
      INSTAGRAM,
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
    target: InstagramChat,
    node: SociablyNode
  ): Promise<null | MetaApiDispatchResponse> {
    if (target instanceof InstagramChat) {
      return this.engine.render(target, node, createChatJobs<InstagramChat>());
    }

    throw new TypeError('invalid rendering target');
  }

  /** Send messages or actions on a chat */
  async message(
    chat: InstagramChat,
    messages: SociablyNode,
    options?: InstagramMessagingOptions
  ): Promise<null | MetaApiDispatchResponse> {
    return this.engine.render(
      chat,
      messages,
      createChatJobs<InstagramChat>(options)
    );
  }

  /** Upload a media chat attachment for later use */
  async uploadChatAttachment(
    /** The {@link InstagramPage} that owns the attachment */
    pageInput: string | InstagramPage,
    /** An {@link Image}, {@link Audio}, {@link Video} or {@link File} element to be uploaded */ node: SociablyNode
  ): Promise<null | UploadAttachmentResult> {
    const page =
      typeof pageInput === 'string' ? new InstagramPage(pageInput) : pageInput;
    const response = await this.engine.render(
      page,
      node,
      createChatAttachmentJobs
    );
    const result = response?.results[0].body;
    return result ? { attachmentId: result.attachment_id } : null;
  }

  async requestApi<ResBody extends MetaApiResponseBody>({
    page: pageInput,
    method = 'GET',
    url,
    params,
    accessToken,
    asApp,
  }: ApiCallOptions): Promise<ResBody> {
    const page =
      typeof pageInput === 'string' ? new InstagramPage(pageInput) : pageInput;
    try {
      const { results } = await this.engine.dispatchJobs(page || null, [
        {
          channel: page,
          request: { method, url, params },
          accessToken,
          asApp,
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

const BotP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [
    ConfigsI,
    AgentSettingsAccessorI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    { appSecret, appId, apiBatchRequestInterval },
    agentSettingsAccessor,
    moduleUitils,
    platformUtils
  ) =>
    new InstagramBot({
      agentSettingsAccessor,
      appId,
      appSecret,
      apiBatchRequestInterval,
      initScope: moduleUitils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(InstagramBot);

type BotP = InstagramBot;
export default BotP;
