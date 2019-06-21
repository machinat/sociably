// @flow
import invariant from 'invariant';

import { BaseBot } from 'machinat-base';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook-receiver';

import type { MachinatNode } from 'machinat/types';
import type { HTTPRequestReceivable } from 'machinat-http-adaptor/types';
import type {
  WebhookResponse,
  WebhookMetadata,
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

class LineBot
  extends BaseBot<
    LineChannel,
    LineEvent,
    WebhookMetadata,
    WebhookResponse,
    LineSegmentValue,
    LineComponent,
    LineJob,
    LineAPIResult
  >
  implements HTTPRequestReceivable {
  options: LineBotOptions;
  // $FlowFixMe https://github.com/facebook/flow/issues/7539
  receiver: WebhookReceiver<LineChannel, LineEvent>;
  worker: LineWorker;

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

    const renderer = new Renderer(
      LINE,
      LINE_NATIVE_TYPE,
      generalElementDelegate
    );

    const worker = new LineWorker(options);
    const receiver = new WebhookReceiver(handleWebhook(options));

    super(LINE, receiver, renderer, worker, options.plugins);

    this.options = options;
    this.receiver = receiver;
    this.worker = worker;
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
