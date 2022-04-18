import invariant from 'invariant';
import fetch from 'node-fetch';
import type {
  MachinatNode,
  MachinatBot,
  InitScopeFn,
  DispatchWrapper,
} from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import Engine, { DispatchError } from '@machinat/core/engine';
import ModuleUtilitiesI from '@machinat/core/base/ModuleUtilities';
import { makeClassProvider } from '@machinat/core/service';
import { createTweetJobs, createDirectMessageJobs } from './job';
import generalElementDelegate from './components/general';
import TwitterWorker from './Worker';
import Tweet from './Tweet';
import TweetTarget from './TweetTarget';
import TwitterUser from './User';
import DirectMessageChat from './Chat';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { TWITTER } from './constant';
import getTimeId from './utils/getTimeId';
import TwitterApiError from './Error';
import type {
  TwitterChannel,
  TwitterSegmentValue,
  TwitterJob,
  TwitterApiResult,
  TwitterDispatchFrame,
  TwitterDispatchResponse,
  TwitterComponent,
  MediaUploadResult,
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
  implements MachinatBot<TwitterChannel, TwitterJob, TwitterApiResult>
{
  client: TwitterWorker;
  agentId: string;
  engine: Engine<
    TwitterChannel,
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
    channel: null | TweetTarget | DirectMessageChat,
    message: MachinatNode
  ): Promise<null | TwitterDispatchResponse> {
    if (channel instanceof DirectMessageChat) {
      return this.engine.render(channel, message, createDirectMessageJobs);
    }

    return this.engine.render(
      channel || new TweetTarget(this.agentId),
      message,
      createTweetJobs({ key: getTimeId() })
    );
  }

  async renderTweet(
    target: null | string | Tweet | TweetTarget,
    message: MachinatNode
  ): Promise<null | TwitterDispatchResponse> {
    const channel =
      typeof target === 'string'
        ? new TweetTarget(this.agentId, target)
        : target instanceof Tweet
        ? new TweetTarget(this.agentId, target.id)
        : !target
        ? new TweetTarget(this.agentId)
        : target;

    return this.render(channel, message);
  }

  async renderDirectMeaasge(
    target: string | TwitterUser | DirectMessageChat,
    message: MachinatNode
  ): Promise<null | TwitterDispatchResponse> {
    const channel =
      typeof target === 'string'
        ? new DirectMessageChat(this.agentId, target)
        : target instanceof TwitterUser
        ? new DirectMessageChat(this.agentId, target.id)
        : target;

    return this.render(channel, message);
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

  async uploadMediaUrl(
    url: string,
    parameters: Record<string, string | number>
  ): Promise<{ id: string; result: MediaUploadResult }> {
    const result = await this.client.uploadMediaUrl(url, parameters);
    return {
      id: result.media_id_string,
      result,
    };
  }

  async uploadMediaFile(
    fileData: Buffer | NodeJS.ReadableStream,
    parameters: Record<string, string | number>
  ): Promise<{ id: string; result: MediaUploadResult }> {
    const result = await this.client.uploadMediaFile(fileData, parameters, {
      contentType: parameters.media_type as string | undefined,
      knownLength: parameters.total_bytes as number | undefined,
    });
    return {
      id: result.media_id_string,
      result,
    };
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
