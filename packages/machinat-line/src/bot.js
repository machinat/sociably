// @flow
import invariant from 'invariant';
import warning from 'warning';

import { Emitter, Engine, Controller, resolvePlugins } from 'machinat-base';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';
import WebhookReceiver from 'machinat-webhook-receiver';

import type { MachinatNode } from 'machinat/types';
import type { MachinatBot } from 'machinat-base/types';
import type { HTTPRequestReceivable } from 'machinat-http-adaptor/types';
import type { WebhookMetadata } from 'machinat-webhook-receiver/types';
import type { AssetStore } from 'machinat-asset-store/types';

import LineWorker from './worker';
import handleWebhook from './webhook';
import { createChatJobs, createMulticastJobs } from './job';
import { LineAssetAccessor } from './asset';

import type {
  LineSource,
  LineBotOptions,
  LineSegmentValue,
  LineComponent,
  LineJob,
  LineAPIResult,
  LineEvent,
  LineSendOptions,
} from './types';

import LineChannel from './channel';
import { LINE_NATIVE_TYPE, ENTRY_REPLY } from './constant';

import generalElementDelegate from './component/general';

type LineBotOptionsInput = $Shape<LineBotOptions>;

type LineReceiver = WebhookReceiver<LineChannel, LineEvent, void>;

type LIFFAppParams = {|
  view: {|
    type: 'compact' | 'tall' | 'full',
    url: string,
  |},
  description?: string,
  features?: {| ble: boolean |},
|};

type EnsureLIFFAppOpts = {|
  id?: string,
  name?: string,
  assetStore?: AssetStore,
|};

const compareLIFFAppParams = (expected: LIFFAppParams, actual: LIFFAppParams) =>
  (!expected.view ||
    (actual.view &&
      expected.view.type === actual.view.type &&
      expected.view.url === actual.view.url)) &&
  expected.description === actual.description &&
  (!expected.features ||
    (actual.features && expected.features.ble === actual.features.ble));

const LINE = 'line';

class LineBot
  extends Emitter<
    LineChannel,
    LineEvent,
    WebhookMetadata,
    LineSegmentValue,
    LineComponent,
    LineJob,
    LineAPIResult
  >
  implements
    HTTPRequestReceivable<LineReceiver>,
    MachinatBot<
      LineChannel,
      LineEvent,
      WebhookMetadata,
      void,
      LineSegmentValue,
      LineComponent,
      LineJob,
      LineAPIResult,
      LineBotOptionsInput,
      LineSendOptions
    > {
  options: LineBotOptions;
  controller: Controller<
    LineChannel,
    LineEvent,
    WebhookMetadata,
    void,
    LineSegmentValue,
    LineComponent,
    LineSendOptions
  >;

  engine: Engine<
    LineChannel,
    LineSegmentValue,
    LineComponent,
    LineJob,
    LineAPIResult
  >;

  receiver: LineReceiver;
  worker: LineWorker;

  constructor(optionsInput: LineBotOptionsInput = {}) {
    super();

    const defaultOpions: LineBotOptionsInput = {
      accessToken: undefined,
      shouldValidateRequest: true,
      channelId: undefined,
      channelSecret: undefined,
      connectionCapicity: 100,
    };

    const options = Object.assign(defaultOpions, optionsInput);

    invariant(
      options.accessToken,
      'should provide accessToken to send messenge'
    );

    invariant(
      !options.shouldValidateRequest || options.channelSecret,
      'should provide channelSecret if shouldValidateRequest set to true'
    );

    warning(
      options.channelId,
      'provide channelId to identify different line channel'
    );

    this.options = options;

    const { eventMiddlewares, dispatchMiddlewares } = resolvePlugins(
      this,
      options.plugins
    );

    this.controller = new Controller(LINE, this, eventMiddlewares);
    this.receiver = new WebhookReceiver(handleWebhook(options));

    this.receiver.bindIssuer(
      this.controller.eventIssuerThroughMiddlewares(this.emitEvent.bind(this)),
      this.emitError.bind(this)
    );

    const renderer = new Renderer(
      LINE,
      LINE_NATIVE_TYPE,
      generalElementDelegate
    );

    const queue = new Queue();
    const worker = new LineWorker(options);

    this.engine = new Engine(
      LINE,
      this,
      renderer,
      queue,
      worker,
      dispatchMiddlewares
    );
  }

  async send(
    source: string | LineSource | LineChannel,
    message: MachinatNode,
    options: LineSendOptions
  ): Promise<null | LineAPIResult[]> {
    const channel =
      source instanceof LineChannel
        ? source
        : new LineChannel(
            typeof source === 'string'
              ? { type: 'user', userId: source }
              : source
          );

    const usePush = !(options && options.replyToken);

    const tasks = await this.engine.renderTasks(
      createChatJobs,
      channel,
      message,
      options,
      usePush
    );

    if (tasks === null) {
      return null;
    }

    if (!usePush) {
      let replyFound = false;

      for (const job of tasks) {
        if (job.type === 'transmit') {
          for (const { entry } of job.payload) {
            const isReply = entry === ENTRY_REPLY;

            invariant(
              !(replyFound && isReply),
              `can not send more than 5 messages with a replyToken`
            );

            replyFound = replyFound || isReply;
          }
        }
      }
    }

    const response = await this.engine.dispatch(channel, tasks, message);
    return response === null ? null : response.results;
  }

  async multicast(
    targets: string[],
    message: MachinatNode
  ): Promise<null | LineAPIResult[]> {
    const tasks = await this.engine.renderTasks(
      createMulticastJobs,
      targets,
      message,
      undefined,
      true
    );

    if (tasks === null) {
      return null;
    }

    const response = await this.engine.dispatch(null, tasks, message);
    return response === null ? null : response.results;
  }

  async ensureLIFFApp(
    params: ?LIFFAppParams,
    { id, name, assetStore }: EnsureLIFFAppOpts
  ): Promise<boolean> {
    let assets: void | LineAssetAccessor;
    let liffId: void | string = id;

    if (!liffId) {
      invariant(name, 'either id or name of LIFF app have to be provided');
      invariant(assetStore, 'assetStore must be provided while using name');

      assets = new LineAssetAccessor(assetStore, this.options.channelId);
      liffId = (await assets.getLIFFApp(name): void | string);
    }

    // removed stored id if params is falsy
    if (!params) {
      if (liffId === undefined) {
        return false;
      }

      if (assets !== undefined) {
        await assets.deleteLIFFApp((name: any));
      }

      await this._dispatchSingleAPICall({
        method: 'DELETE',
        entry: `liff/v1/apps/${liffId}`,
      });

      return true;
    }

    // create liff app if name provided but no id stored
    if (liffId === undefined && assets !== undefined) {
      const result = await this._dispatchSingleAPICall({
        method: 'POST',
        entry: 'liff/v1/apps',
        body: params,
      });

      await assets.setLIFFApp((name: any), result.liffId);
      return true;
    }

    // get actually existed apps
    const { apps } = await this._dispatchSingleAPICall({
      method: 'GET',
      entry: 'liff/v1/apps',
      body: params,
    });

    const app = apps.find(a => a.liffId === liffId);

    // if app with stored id not existed, create one
    if (app === undefined) {
      if (assets === undefined) {
        throw Error(`LIFF app with id [ ${(liffId: any)} ] not existed`);
      }

      const result = await this._dispatchSingleAPICall({
        method: 'POST',
        entry: 'liff/v1/apps',
        body: params,
      });

      await assets.setLIFFApp((name: any), result.liffId);
      return true;
    }

    // if app not match with params, update it
    if (!compareLIFFAppParams(params, app)) {
      await this._dispatchSingleAPICall({
        method: 'PUT',
        entry: 'liff/v1/apps',
        body: params,
      });

      return true;
    }

    return false;
  }

  async _dispatchSingleAPICall(job: LineJob): Promise<LineAPIResult> {
    const response = await this.engine.dispatch(null, [
      { type: 'transmit', payload: [job] },
    ]);

    return response.results[0];
  }
}

export default LineBot;
