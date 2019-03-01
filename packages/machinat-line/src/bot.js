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
  LineRawEvent,
} from './types';

import { ChatThread, MulticastThread } from './thread';
import { LINE_NATIVE_TYPE } from './symbol';

import * as generalElementDelegate from './component/general';

type LineBotOptionsInput = $Shape<LineBotOptions>;

const LINE = 'line';

export default class LineBot
  extends BaseBot<
    LineRawEvent,
    WebhookResponse,
    LineActionValue,
    LineComponent,
    LineJob,
    LineAPIResult,
    ChatThread | MulticastThread,
    ChatThread
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

    super(controller, engine, options.plugins);

    this.options = options;
    this.client = client;
    this.receiver = new WebhookReceiver(
      handleWebhook(options),
      this.eventHandler()
    );
  }

  reply(token: string, node: MachinatNode) {
    const thread = new ChatThread(undefined, token, this.options.useReplyAPI);

    return this.deliver(thread, node);
  }

  push(source: string | LineSource, node: MachinatNode) {
    const thread = new ChatThread(
      typeof source === 'string' ? { type: 'user', userId: source } : source,
      undefined,
      this.options.useReplyAPI
    );

    return this.deliver(thread, node);
  }

  multicast(to: string[], node: MachinatNode) {
    const thread = new MulticastThread(to);

    return this.deliver(thread, node);
  }
}
