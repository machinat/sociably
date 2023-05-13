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
import generalComponentDelegator from './components/general';
import { FACEBOOK, PATH_FEED, PATH_PHOTOS } from './constant';
import {
  ConfigsI,
  PlatformUtilitiesI,
  PageSettingsAccessorI,
} from './interface';
import FacebookPage from './Page';
import FacebookChat from './Chat';
import InteractTarget from './InteractTarget';
import {
  createChatJobs,
  createChatAttachmentJobs,
  createPostJobs,
  createInteractJobs,
} from './job';
import type {
  FacebookThread,
  FacebookComponent,
  FacebookSegmentValue,
  FacebookDispatchFrame,
  MessagingOptions,
  FacebookPageSettings,
} from './types';

type FacebookDispatchTarget = FacebookThread | FacebookPage;

type FacebookBotOptions = {
  appSecret?: string;
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
  pageSettingsAccessor: AgentSettingsAccessor<
    FacebookPage,
    FacebookPageSettings
  >;
  initScope?: InitScopeFn;
  dispatchWrapper?: DispatchWrapper<
    MetaApiJob,
    FacebookDispatchFrame,
    MetaApiResult
  >;
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

type ApiCallOptions = {
  /** The page to make the API call */
  page: string | FacebookPage;
  /** HTTP method */
  method?: string;
  /** API request URL relative to https://graph.facebook.com/{version}/ */
  url: string;
  /** API request parameters */
  params?: Record<string, unknown>;
};

/**
 * FacebookBot render messages and make API call to Facebook platform.
 * @category Provider
 */
export class FacebookBot
  implements SociablyBot<FacebookThread, MetaApiJob, MetaApiResult>
{
  worker: MetaApiWorker;
  engine: Engine<
    FacebookDispatchTarget,
    FacebookSegmentValue,
    FacebookComponent<unknown>,
    MetaApiJob,
    MetaApiResult
  >;

  platform = FACEBOOK;

  constructor({
    appSecret,
    graphApiVersion = 'v11.0',
    apiBatchRequestInterval = 500,
    pageSettingsAccessor,
    initScope,
    dispatchWrapper,
  }: FacebookBotOptions) {
    const renderer = new Renderer<
      FacebookSegmentValue,
      FacebookComponent<unknown>
    >(FACEBOOK, generalComponentDelegator);

    const queue = new Queue<MetaApiJob, MetaApiResult>();
    const worker = new MetaApiWorker(
      pageSettingsAccessor,
      appSecret,
      graphApiVersion,
      apiBatchRequestInterval
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
    target: FacebookDispatchTarget,
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
    /** The {@link FacebookPage} that owns the attachment */
    pageInput: string | FacebookPage,
    /** An {@link Image}, {@link Audio}, {@link Video} or {@link File} element to be uploaded */ node: SociablyNode
  ): Promise<null | UploadAttachmentResult> {
    const page =
      typeof pageInput === 'string' ? new FacebookPage(pageInput) : pageInput;
    const response = await this.engine.render(
      page,
      node,
      createChatAttachmentJobs
    );
    const result = response?.results[0].body;
    return result ? { attachmentId: result.attachment_id } : null;
  }

  /** Create a post or a photo on the page feed */
  async post(
    /** The {@link FacebookPage} to post */
    pageInput: string | FacebookPage,
    /** Text, a {@link PagePost} or a {@link PagePhoto} to post */
    node: SociablyNode
  ): Promise<null | PagePostResult> {
    const page =
      typeof pageInput === 'string' ? new FacebookPage(pageInput) : pageInput;
    const response = await this.engine.render(page, node, createPostJobs);
    if (!response) {
      return null;
    }

    const photos: PagePhotoResult[] = [];
    let postId: undefined | string;

    const { jobs, results } = response;
    for (const [i, { request }] of jobs.entries()) {
      const resultBody = results[i].body;

      if (request.url === PATH_FEED) {
        postId = resultBody.id;
      } else if (request.url === PATH_PHOTOS) {
        if (resultBody.post_id) {
          postId = resultBody.post_id;
        }
        photos.push({ photoId: resultBody.id });
      }
    }
    if (!postId) {
      return null;
    }
    return { postId, photos };
  }

  /** Comment or make reactions to a Facebook post or comment */
  async interact(
    /** The target thread to interact with */
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
      if (request.url === PATH_PHOTOS) {
        photo = { photoId: response.results[i].body.id };
      } else if (request.url === PATH_PHOTOS) {
        results.push({
          commentId: response.results[i].body.id,
          photo,
        });
        photo = null;
      }
    }
    return results;
  }

  async requestApi<ResBody extends MetaApiResponseBody>({
    page: pageInput,
    method = 'GET',
    url,
    params,
  }: ApiCallOptions): Promise<ResBody> {
    const page =
      typeof pageInput === 'string' ? new FacebookPage(pageInput) : pageInput;
    try {
      const { results } = await this.engine.dispatchJobs(page, [
        {
          channel: page,
          request: { method, url, params },
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
    PageSettingsAccessorI,
    { require: ModuleUtilitiesI, optional: true },
    { require: PlatformUtilitiesI, optional: true },
  ],
  factory: (
    { appSecret, apiBatchRequestInterval },
    pageSettingsAccessor,
    moduleUitils,
    platformUtils
  ) =>
    new FacebookBot({
      pageSettingsAccessor,
      appSecret,
      apiBatchRequestInterval,
      initScope: moduleUitils?.initScope,
      dispatchWrapper: platformUtils?.dispatchWrapper,
    }),
})(FacebookBot);

type BotP = FacebookBot;
export default BotP;
