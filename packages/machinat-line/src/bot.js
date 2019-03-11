// @flow
import invariant from 'invariant';

import { BaseBot, Engine, Controller } from 'machinat-base';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook';

import type { MachinatNode } from 'machinat/types';
import type { HTTPReceivable, HTTPReceiver } from 'machinat-base/types';
import type { WebhookResponse } from 'machinat-webhook/types';

import LineClient from './client';
import handleWebhook from './handleWebhook';

import type {
  LineSource,
  LineBotOptions,
  LineActionValue,
  LineComponent,
  LineJob,
  LineAPIResult,
  LineEvent,
} from './types';

import { ChatThread, MulticastThread } from './thread';
import { LINE_NATIVE_TYPE } from './symbol';

import * as generalElementDelegate from './component/general';

type LineBotOptionsInput = $Shape<LineBotOptions>;

const LINE = 'line';

// $FlowFixMe https://github.com/facebook/flow/issues/7539
class LineBot
  extends BaseBot<
    LineActionValue,
    LineComponent,
    LineJob,
    LineAPIResult,
    ChatThread | MulticastThread,
    WebhookResponse,
    ChatThread,
    LineEvent
  >
  implements HTTPReceivable {
  options: LineBotOptions;
  receiver: HTTPReceiver;
  client: LineClient;

  constructor(optionsInput: LineBotOptionsInput = {}) {
    const defaultOpions: LineBotOptionsInput = {
      accessToken: undefined,
      shouldValidateRequest: true,
      channelSecret: undefined,
      useReplyAPI: false,
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

    const client = new LineClient(options);
    const engine = new Engine(LINE, queue, renderer, client);
    const receiver = new WebhookReceiver(handleWebhook(options));

    super(receiver, controller, engine, options.plugins);

    this.options = options;
    this.client = client;
  }

  reply(token: string, node: MachinatNode): Promise<null | LineAPIResult[]> {
    const thread = new ChatThread(undefined, token, this.options.useReplyAPI);

    return this.engine.dispatch(thread, node);
  }

  push(
    source: string | LineSource,
    node: MachinatNode
  ): Promise<null | LineAPIResult[]> {
    const thread = new ChatThread(
      typeof source === 'string' ? { type: 'user', userId: source } : source,
      undefined,
      this.options.useReplyAPI
    );

    return this.engine.dispatch(thread, node);
  }

  multicast(to: string[], node: MachinatNode): Promise<null | LineAPIResult[]> {
    const thread = new MulticastThread(to);

    return this.engine.dispatch(thread, node);
  }
}

export default LineBot;
