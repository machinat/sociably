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
import TweetTarget from './TweetTarget';
import DirectMessageChat from './Chat';
import TwitterUser from './User';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { TWITTER } from './constant';
import { getTimeId } from './utils';
import TwitterApiError from './Error';
import type {
  TwitterChannel,
  TwitterSegmentValue,
  TwitterJob,
  TwitterApiResult,
  TwitterDispatchFrame,
  TwitterDispatchResponse,
  TwitterComponent,
} from './types';

type TwitterBotOptions = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
  maxConnections?: number;
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
  worker: TwitterWorker;
  engine: Engine<
    TwitterChannel,
    TwitterSegmentValue,
    TwitterComponent<unknown>,
    TwitterJob,
    TwitterApiResult
  >;

  constructor({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
    maxConnections = 100,
    initScope,
    dispatchWrapper,
  }: TwitterBotOptions) {
    invariant(appKey, 'options.appKey should not be empty');
    invariant(appSecret, 'options.appSecret should not be empty');
    invariant(accessToken, 'options.accessToken should not be empty');
    invariant(accessSecret, 'options.accessSecret should not be empty');

    const queue = new Queue<TwitterJob, TwitterApiResult>();
    this.worker = new TwitterWorker({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
      maxConnections,
    });
    const renderer = new Renderer<
      TwitterSegmentValue,
      TwitterComponent<unknown>
    >(TWITTER, generalElementDelegate);

    this.engine = new Engine(
      TWITTER,
      renderer,
      queue,
      this.worker,
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
    target: null | TweetTarget | DirectMessageChat | TwitterUser,
    message: MachinatNode
  ): Promise<null | TwitterDispatchResponse> {
    if (target === null || target instanceof TweetTarget) {
      return this.engine.render(
        target,
        message,
        createTweetJobs({ key: getTimeId() })
      );
    }

    return this.engine.render(
      target instanceof TwitterUser ? new DirectMessageChat(target.id) : target,
      message,
      createDirectMessageJobs
    );
  }

  async makeApiCall<Result>(
    method: string,
    href: string,
    parameters?: Record<string, unknown>
  ): Promise<Result> {
    try {
      const response = await this.engine.dispatchJobs(null, [
        {
          request: { method, href, parameters },
          target: null,
          refreshTarget: null,
          key: undefined,
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

  async fetchMediaFile(url: string): Promise<{
    content: NodeJS.ReadableStream;
    contentType?: string;
    contentLength?: number;
  }> {
    const response = await fetch(url, {
      headers: {
        Authorization: this.worker.getAuthHeader('GET', url),
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
    { appKey, appSecret, accessToken, accessSecret, maxConnections },
    moduleUtils,
    platformUtils
  ) => {
    invariant(appKey, 'configs.appKey should not be empty');

    return new TwitterBot({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
      maxConnections,
      initScope: moduleUtils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    });
  },
})(TwitterBot);

type BotP = TwitterBot;
export default BotP;
