import invariant from 'invariant';
import fetch from 'node-fetch';
import type {
  SociablyNode,
  SociablyBot,
  InitScopeFn,
  DispatchWrapper,
} from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import Queue from '@sociably/core/queue';
import Engine, { DispatchError } from '@sociably/core/engine';
import { formatNode, getTimeId } from '@sociably/core/utils';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import { serviceProviderClass } from '@sociably/core/service';
import {
  createTweetJobs,
  createDirectMessageJobs,
  createWelcomeMessageJobs,
} from './job';
import generalElementDelegate from './components/general';
import TwitterWorker from './Worker';
import TweetTarget from './TweetTarget';
import TwitterUser from './User';
import DirectMessageChat from './Chat';
import {
  ConfigsI,
  PlatformUtilitiesI,
  AgentSettingsAccessorI,
} from './interface';
import { TWITTER } from './constant';
import TwitterApiError from './Error';
import type {
  TwitterThread,
  TwitterSegmentValue,
  TwitterJob,
  TwitterApiResult,
  TwitterDispatchFrame,
  TwitterDispatchResponse,
  TwitterComponent,
  MediaAttachment,
  RenderMediaResponse,
} from './types';

type TwitterBotOptions = {
  appKey: string;
  appSecret: string;
  bearerToken: string;
  maxRequestConnections?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    TwitterJob,
    TwitterDispatchFrame,
    TwitterApiResult
  >;
};

type ApiCallOptions = {
  /** The agent user to make the API call with */
  agent?: string | TwitterUser;
  /** HTTP method */
  method: string;
  /** API request URL relative to https://api.twitter.com/ */
  url: string;
  /** API request parameters */
  params?: Record<string, unknown>;
  /** Call the API using app scoped auth */
  asApplication?: boolean;
};

/**
 * @category Provider
 */
export class TwitterBot
  implements SociablyBot<TwitterThread, TwitterJob, TwitterApiResult>
{
  agentSettingsAccessor: AgentSettingsAccessorI;
  client: TwitterWorker;
  engine: Engine<
    TwitterThread,
    TwitterSegmentValue,
    TwitterComponent<unknown>,
    TwitterJob,
    TwitterApiResult
  >;

  platform = TWITTER;

  constructor(
    agentSettingsAccessor: AgentSettingsAccessorI,
    {
      appKey,
      appSecret,
      bearerToken,
      maxRequestConnections = 100,
      initScope,
      dispatchWrapper,
    }: TwitterBotOptions
  ) {
    invariant(appKey, 'options.appKey should not be empty');
    invariant(appSecret, 'options.appSecret should not be empty');
    invariant(bearerToken, 'options.bearerToken should not be empty');

    const queue = new Queue<TwitterJob, TwitterApiResult>();
    this.agentSettingsAccessor = agentSettingsAccessor;
    this.client = new TwitterWorker(agentSettingsAccessor, {
      appKey,
      appSecret,
      bearerToken,
      maxConnections: maxRequestConnections,
    });
    const renderer = new Renderer<
      TwitterSegmentValue,
      TwitterComponent<unknown>
    >(TWITTER, generalElementDelegate);

    this.engine = new Engine(
      TWITTER,
      renderer,
      queue,
      this.client,
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

  render(
    thread: TweetTarget | DirectMessageChat,
    message: SociablyNode
  ): Promise<null | TwitterDispatchResponse> {
    if (thread instanceof DirectMessageChat) {
      return this.engine.render(thread, message, createDirectMessageJobs);
    }

    return this.engine.render(
      thread,
      message,
      createTweetJobs({ key: getTimeId() })
    );
  }

  async requestApi<Result>({
    agent,
    method,
    url,
    params = {},
    asApplication = false,
  }: ApiCallOptions): Promise<Result> {
    const agentId = typeof agent === 'string' ? agent : agent?.id;
    const target = agentId ? new TweetTarget(agentId) : null;
    try {
      const response = await this.engine.dispatchJobs(target, [
        {
          request: { method, url, params },
          target,
          refreshTarget: null,
          key: undefined,
          asApplication,
          accomplishRequest: null,
          mediaSources: null,
        },
      ]);

      return response.results[0].body as Result;
    } catch (err) {
      if (err instanceof DispatchError) {
        throw err.errors[0];
      }
      throw err;
    }
  }

  async uploadMedia(
    agentIdOrInstance: string | TwitterUser,
    media: SociablyNode
  ): Promise<null | RenderMediaResponse[]> {
    const segments = await this.engine.renderer.render(media, null, null);
    if (!segments) {
      return null;
    }

    const attachments: MediaAttachment[] = [];

    for (const segment of segments) {
      if (segment.type !== 'unit' || segment.value.type !== 'media') {
        throw new Error(`${formatNode(segment.node)} is not media`);
      }

      const { attachment } = segment.value;
      if (attachment.source.type !== 'id') {
        attachments.push(attachment);
      }
    }

    const agent =
      typeof agentIdOrInstance === 'string'
        ? new TwitterUser(agentIdOrInstance)
        : agentIdOrInstance;
    const { uploadedMedia } = await this.client.uploadMediaSources(
      agent,
      attachments.map(({ source }) => source)
    );
    if (!uploadedMedia) {
      return null;
    }

    return uploadedMedia.map(({ source, result }, i) => ({
      type: attachments[i].type,
      id: result.media_id_string,
      source,
      result,
    }));
  }

  async createWelcomeMessage(
    agent: string | TwitterUser,
    name: undefined | string,
    message: SociablyNode
  ): Promise<null | {
    /* eslint-disable camelcase */
    welcome_message: {
      id: string;
      created_timestamp: string;
      message_data: any;
    };
    /* eslint-enable camelcase */
    name: string;
  }> {
    const agentId = typeof agent === 'string' ? agent : agent?.id;
    const response = await this.engine.render(
      new TweetTarget(agentId),
      message,
      createWelcomeMessageJobs(name)
    );
    return (response?.results[0].body as any) || null;
  }

  async fetchMediaFile(
    agentIdOrInstance: string | TwitterUser,
    url: string
  ): Promise<{
    content: NodeJS.ReadableStream;
    contentType?: string;
    contentLength?: number;
  }> {
    const agent =
      typeof agentIdOrInstance === 'string'
        ? new TwitterUser(agentIdOrInstance)
        : agentIdOrInstance;

    const authHeader = await this.client.getUserOauthHeader(agent, 'GET', url);
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      throw new TwitterApiError(response.status);
    }

    const contentLength = response.headers.get('content-length');
    return {
      content: response.body,
      contentType: response.headers.get('content-type') || undefined,
      contentLength: contentLength ? Number(contentLength) : undefined,
    };
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
    { appKey, appSecret, bearerToken, maxRequestConnections },
    settingsAccessor,
    moduleUtils,
    platformUtils
  ) => {
    invariant(appKey, 'configs.appKey should not be empty');

    return new TwitterBot(settingsAccessor, {
      appKey,
      appSecret,
      bearerToken,
      maxRequestConnections,
      initScope: moduleUtils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    });
  },
})(TwitterBot);

type BotP = TwitterBot;
export default BotP;
