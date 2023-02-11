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
import { FACEBOOK, PATH_FEED, PATH_PHOTOS } from './constant';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import FacebookChat from './Chat';
import InteractTarget from './InteractTarget';
import FacebookPage from './Page';
import {
  createChatJobs,
  createChatAttachmentJobs,
  createPostJobs,
  createInteractJobs,
} from './job';
import type {
  FacebookChannel,
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

type UploadAttachmentResult = {
  attachmentId: string;
};

type PagePhotoResult = {
  photoId: string;
};

type PagePostResult = {
  postId: string;
  photos: PagePhotoResult[];
};

type CommentResult = {
  commentId: string;
  photo: null | PagePhotoResult;
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
    target: FacebookChannel,
    node: SociablyNode
  ): Promise<null | MetaApiDispatchResponse> {
    if (target instanceof FacebookChat) {
      return this.engine.render(target, node, createChatJobs());
    }
    if (target instanceof FacebookPage) {
      return this.engine.render(target, node, createPostJobs);
    }
    if (target instanceof InteractTarget) {
      return this.engine.render(target, node, createInteractJobs);
    }
    throw new TypeError('invalid rendering target');
  }

  /** Send messages or actions on a chat */
  async message(
    chat: FacebookChat,
    messages: SociablyNode,
    options?: MessagingOptions
  ): Promise<null | MetaApiDispatchResponse> {
    return this.engine.render(chat, messages, createChatJobs(options));
  }

  /** Upload a media chat attachment for later use */
  async uploadChatAttachment(
    /** An {@link Image}, {@link Audio}, {@link Video} or {@link File} element to be uploaded */
    node: SociablyNode
  ): Promise<null | UploadAttachmentResult> {
    const response = await this.engine.render(
      null,
      node,
      createChatAttachmentJobs
    );
    const result = response?.results[0].body;
    return result ? { attachmentId: result.attachment_id } : null;
  }

  /** Create a post or a photo on the page feed */
  async post(
    /** The {@link FacebookPage} channel to post */
    page: FacebookPage,
    /** Text, a {@link PagePost} or a {@link PagePhoto} to post */
    node: SociablyNode
  ): Promise<null | PagePostResult> {
    const response = await this.engine.render(null, node, createPostJobs);
    if (!response) {
      return null;
    }

    const photos: PagePhotoResult[] = [];
    let postId: undefined | string;

    for (const [i, { request }] of response.jobs.entries()) {
      const result = response.results[i].body;

      if (request.relative_url === PATH_FEED) {
        postId = result.id;
      } else if (request.relative_url === PATH_PHOTOS) {
        if (result.post_id) {
          postId = result.post_id;
        }
        photos.push({ photoId: result.id });
      }
    }
    if (!postId) {
      return null;
    }
    return { postId, photos };
  }

  /** Comment or make reactions to a Facebook post or comment */
  async interact(
    /** The target channel to interact with */
    target: InteractTarget,
    /** {@link Comment} or {@link Reaction} */
    node: SociablyNode
  ): Promise<null | CommentResult[]> {
    const response = await this.engine.render(target, node, createInteractJobs);
    if (!response) {
      return null;
    }

    const results: CommentResult[] = [];
    let photo: null | PagePhotoResult = null;

    for (const [i, { request }] of response.jobs.entries()) {
      if (request.relative_url === PATH_PHOTOS) {
        photo = { photoId: response.results[i].body.id };
      } else if (request.relative_url === PATH_PHOTOS) {
        results.push({
          commentId: response.results[i].body.id,
          photo,
        });
        photo = null;
      }
    }
    return results;
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
