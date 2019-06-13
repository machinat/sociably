// @flow
import invariant from 'invariant';

import { BaseBot, Engine, Controller } from 'machinat-base';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook-receiver';

import type { MachinatNode } from 'machinat/types';
import type { HTTPRequestReceivable } from 'machinat-http-adaptor/types';
import type {
  WebhookResponse,
  WebhookTransport,
} from 'machinat-webhook-receiver/types';

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

import LineChannel from './channel';
import { LINE_NATIVE_TYPE } from './constant';

import * as generalElementDelegate from './component/general';

type LineBotOptionsInput = $Shape<LineBotOptions>;

const LINE = 'line';

// $FlowFixMe https://github.com/facebook/flow/issues/7539
class LineBot
  extends BaseBot<
    LineChannel,
    LineEvent,
    WebhookTransport,
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
    const channel = new LineChannel(
      typeof source === 'string' ? { type: 'user', userId: source } : source
    );

    const usePush = !(options && options.replyToken);

    const tasks = this.engine.renderTasks(
      createChatJobs,
      channel,
      message,
      options,
      usePush
    );
    if (tasks === null) return null;

    if (!usePush) {
      let replyFound = false;

      for (const job of tasks) {
        if (job.type === 'transmit') {
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

    const response = await this.engine.dispatch(channel, tasks, message);
    return response === null ? null : response.results;
  }

  async multicast(
    targets: string[],
    message: MachinatNode
  ): Promise<null | LineAPIResult[]> {
    const tasks = this.engine.renderTasks(
      createMulticastJobs,
      targets,
      message,
      undefined,
      true
    );
    if (tasks === null) return null;

    const response = await this.engine.dispatch(null, tasks, message);
    return response === null ? null : response.results;
  }
}

export default LineBot;
