// @flow
import invariant from 'invariant';

import { BaseBot, Engine, Controller } from 'machinat-base';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook-receiver';

import type { MachinatNode } from 'machinat/types';
import type { HTTPRequestReceivable } from 'machinat-http-adaptor/types';
import type { WebhookResponse } from 'machinat-webhook-receiver/types';

import LineWorker from './worker';
import handleWebhook from './handleWebhook';
import { createChatJobs, createMulticastJobs } from './job';

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

import LineThread from './thread';
import { LINE_NATIVE_TYPE } from './constant';

import * as generalElementDelegate from './component/general';

type LineBotOptionsInput = $Shape<LineBotOptions>;

const LINE = 'line';

// $FlowFixMe https://github.com/facebook/flow/issues/7539
class LineBot
  extends BaseBot<
    LineThread,
    LineEvent,
    LineSegmentValue,
    LineComponent,
    WebhookResponse,
    LineJob,
    LineAPIResult
  >
  implements HTTPRequestReceivable {
  options: LineBotOptions;

  constructor(optionsInput: LineBotOptionsInput = {}) {
    const defaultOpions: LineBotOptionsInput = {
      accessToken: undefined,
      shouldValidateRequest: true,
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

    const controller = new Controller();

    const queue = new Queue();
    const renderer = new Renderer(
      LINE,
      LINE_NATIVE_TYPE,
      generalElementDelegate
    );

    const worker = new LineWorker(options);
    const engine = new Engine(LINE, renderer, queue, worker);
    const receiver = new WebhookReceiver(handleWebhook(options));

    super(receiver, controller, engine, options.plugins);

    this.options = options;
  }

  async send(
    source: string | LineSource,
    message: MachinatNode,
    options: LineSendOptions
  ): Promise<null | LineAPIResult[]> {
    const thread = new LineThread(
      typeof source === 'string' ? { type: 'user', userId: source } : source
    );

    const usePush = !(options && options.replyToken);

    const jobs = this.engine.renderActions(
      createChatJobs,
      thread,
      message,
      options,
      usePush
    );
    if (jobs === null) return null;

    if (!usePush) {
      let replyFound = false;

      for (const job of jobs) {
        if (job.type === 'jobs') {
          for (const { entry } of job.payload) {
            const isReply = entry === 'message/reply';

            invariant(
              !(replyFound && isReply),
              `can not send more than 5 messages with a replyToken`
            );

            replyFound = replyFound || isReply;
          }
        }
      }
    }

    const response = await this.engine.dispatch(thread, jobs, message);
    return response === null ? null : response.results;
  }

  async multicast(
    targets: string[],
    message: MachinatNode
  ): Promise<null | LineAPIResult[]> {
    const jobs = this.engine.renderActions(
      createMulticastJobs,
      targets,
      message,
      undefined,
      true
    );
    if (jobs === null) return null;

    const response = await this.engine.dispatch(null, jobs, message);
    return response === null ? null : response.results;
  }
}

export default LineBot;
