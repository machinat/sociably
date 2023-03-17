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
import { makeClassProvider } from '@sociably/core/service';
import {
  createTweetJobs,
  createDirectMessageJobs,
  createWelcomeMessageJobs,
} from './job';
import generalElementDelegate from './components/general';
import TwitterWorker from './Worker';
import Tweet from './Tweet';
import TweetTarget from './TweetTarget';
import TwitterUser from './User';
import DirectMessageChat from './Chat';
import { ConfigsI, PlatformUtilitiesI } from './interface';
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
  accessToken: string;
  accessSecret: string;
  maxRequestConnections?: number;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    TwitterJob,
    TwitterDispatchFrame,
    TwitterApiResult
  >;
};

/**
 * @category Provider
 */
export class TwitterBot
  implements SociablyBot<TwitterThread, TwitterJob, TwitterApiResult>
{
  client: TwitterWorker;
  agentId: string;
  engine: Engine<
    TwitterThread,
    TwitterSegmentValue,
    TwitterComponent<unknown>,
    TwitterJob,
    TwitterApiResult
  >;

  platform = TWITTER;

  constructor({
    appKey,
    appSecret,
    bearerToken,
    accessToken,
    accessSecret,
    maxRequestConnections = 100,
    initScope,
    dispatchWrapper,
  }: TwitterBotOptions) {
    invariant(appKey, 'options.appKey should not be empty');
    invariant(appSecret, 'options.appSecret should not be empty');
    invariant(bearerToken, 'options.bearerToken should not be empty');
    invariant(accessToken, 'options.accessToken should not be empty');
    invariant(accessSecret, 'options.accessSecret should not be empty');
    this.agentId = accessToken.split('-', 1)[0];

    const queue = new Queue<TwitterJob, TwitterApiResult>();
    this.client = new TwitterWorker({
      appKey,
      appSecret,
      bearerToken,
      accessToken,
      accessSecret,
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
    thread: null | TweetTarget | DirectMessageChat,
    message: SociablyNode
  ): Promise<null | TwitterDispatchResponse> {
    if (thread instanceof DirectMessageChat) {
      return this.engine.render(thread, message, createDirectMessageJobs);
    }

    return this.engine.render(
      thread || new TweetTarget(this.agentId),
      message,
      createTweetJobs({ key: getTimeId() })
    );
  }

  async renderTweet(
    target: null | string | Tweet | TweetTarget,
    message: SociablyNode
  ): Promise<null | TwitterDispatchResponse> {
    const thread =
      typeof target === 'string'
        ? new TweetTarget(this.agentId, target)
        : target instanceof Tweet
        ? new TweetTarget(this.agentId, target.id)
        : !target
        ? new TweetTarget(this.agentId)
        : target;

    return this.render(thread, message);
  }

  async renderDirectMeaasge(
    target: string | TwitterUser | DirectMessageChat,
    message: SociablyNode
  ): Promise<null | TwitterDispatchResponse> {
    const thread =
      typeof target === 'string'
        ? new DirectMessageChat(this.agentId, target)
        : target instanceof TwitterUser
        ? new DirectMessageChat(this.agentId, target.id)
        : target;

    return this.render(thread, message);
  }

  async makeApiCall<Result>(
    method: string,
    href: string,
    parameters?: Record<string, unknown>,
    options?: { asApplication?: boolean }
  ): Promise<Result> {
    try {
      const response = await this.engine.dispatchJobs(null, [
        {
          request: { method, href, parameters },
          target: new TweetTarget(this.agentId),
          refreshTarget: null,
          key: undefined,
          asApplication: !!options?.asApplication,
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

  async renderMedia(
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

    const { uploadedMedia } = await this.client.uploadMediaSources(
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

  async renderWelcomeMessage(
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
    const response = await this.engine.render(
      null,
      message,
      createWelcomeMessageJobs({ name })
    );
    return (response?.results[0].body as any) || null;
  }

  async fetchMediaFile(url: string): Promise<{
    content: NodeJS.ReadableStream;
    contentType?: string;
    contentLength?: number;
  }> {
    const response = await fetch(url, {
      headers: {
        Authorization: this.client.getAuthHeader('GET', url),
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

const BotP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    ConfigsI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    {
      appKey,
      appSecret,
      bearerToken,
      accessToken,
      accessSecret,
      maxRequestConnections,
    },
    moduleUtils,
    platformUtils
  ) => {
    invariant(appKey, 'configs.appKey should not be empty');

    return new TwitterBot({
      appKey,
      appSecret,
      bearerToken,
      accessToken,
      accessSecret,
      maxRequestConnections,
      initScope: moduleUtils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    });
  },
})(TwitterBot);

type BotP = TwitterBot;
export default BotP;
