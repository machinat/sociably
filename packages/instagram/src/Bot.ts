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
  MetaApiChannel,
  MetaApiJob,
  MetaApiResult,
  MetaApiDispatchResponse,
  MetaApiResponseBody,
  MetaRequestApiOptions,
} from '@sociably/meta-api';
import {
  createChatJobs,
  createUploadChatAttachmentJobs,
  MessengerBot,
} from '@sociably/messenger';
import { renderGeneralComponents } from '@sociably/messenger/components';
import { INSTAGRAM } from './constant.js';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface.js';
import InstagramAgent from './Agent.js';
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
    InstagramAgent,
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

/**
 * InstagramBot render messages and make API call to Instagram platform.
 * @category Provider
 */
export class InstagramBot
  implements
    MessengerBot<MetaApiChannel>,
    SociablyBot<InstagramChat, MetaApiJob, MetaApiResult>
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
    graphApiVersion = 'v17.0',
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
      return this.engine.render(
        target,
        node,
        createChatJobs<InstagramAgent, InstagramChat>(target.agent)
      );
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
      createChatJobs<InstagramAgent, InstagramChat>(chat.agent, options)
    );
  }

  /** Upload a media chat attachment for later use */
  async uploadChatAttachment(
    /** The {@link InstagramAgent} that owns the attachment */
    agentInput: string | InstagramAgent,
    /** An {@link Image}, {@link Audio}, {@link Video} or {@link File} element to be uploaded */ node: SociablyNode
  ): Promise<null | UploadAttachmentResult> {
    const agent =
      typeof agentInput === 'string'
        ? new InstagramAgent(agentInput)
        : agentInput;
    const response = await this.engine.render(
      agent,
      node,
      createUploadChatAttachmentJobs({ platform: 'instagram' })
    );
    const result = response?.results[0].body;
    return result ? { attachmentId: result.attachment_id } : null;
  }

  async requestApi<ResBody extends MetaApiResponseBody>({
    channel: agentInput,
    method = 'GET',
    url,
    params,
    accessToken,
    asApp,
  }: MetaRequestApiOptions<InstagramAgent>): Promise<ResBody> {
    const account =
      typeof agentInput === 'string'
        ? new InstagramAgent(agentInput)
        : agentInput;
    try {
      const { results } = await this.engine.dispatchJobs(account || null, [
        {
          channel: account,
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
