// @flow
import invariant from 'invariant';

import { BaseBot, Engine, Controller } from 'machinat-base';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook';

import type { MachinatNode } from 'machinat/types';
import type { WebhookResponse } from 'machinat-webhook/types';
import type { HTTPReceivable, HTTPReceiver } from 'machinat-base/types';

import MessengerClient from './client';
import handleWebhook from './handleWebhook';
import { MESSAGE_CREATIVES_THREAD } from './thread';
import { MESSENGER_NAITVE_TYPE } from './symbol';
import * as generalComponents from './component/general';

import type {
  MessengerBotOptions,
  MessengerRawEvent,
  MessengerComponent,
  MessengerJob,
  MessengerAPIResult,
  MessengerActionValue,
} from './types';
import type { ChatThread } from './thread';

type MessengerBotOptionsInput = $Shape<MessengerBotOptions>;

const MESSENGER = 'messenger';

export default class MessengerBot
  extends BaseBot<
    MessengerRawEvent,
    WebhookResponse,
    MessengerActionValue,
    MessengerComponent,
    MessengerJob,
    MessengerAPIResult,
    ChatThread | typeof MESSAGE_CREATIVES_THREAD,
    ChatThread
  >
  implements HTTPReceivable {
  options: MessengerBotOptions;
  receiver: HTTPReceiver;
  client: MessengerClient;

  constructor(optionsInput: MessengerBotOptionsInput = {}) {
    const defaultOpions: MessengerBotOptionsInput = {
      appSecret: undefined,
      accessToken: undefined,
      shouldValidateRequest: true,
      shouldVerifyWebhook: true,
      verifyToken: undefined,
      respondTimeout: 5000,
      consumeInterval: undefined,
    };

    const options = Object.assign(defaultOpions, optionsInput);

    invariant(
      options.accessToken,
      'should provide accessToken to send messenge'
    );

    invariant(
      !options.shouldValidateRequest || options.appSecret,
      'should provide appSecret if shouldValidateRequest set to true'
    );

    invariant(
      !options.shouldVerifyWebhook || options.verifyToken,
      'should provide verifyToken if shouldVerifyWebhook set to true'
    );

    const controller = new Controller();

    const renderer = new Renderer(
      MESSENGER,
      MESSENGER_NAITVE_TYPE,
      generalComponents
    );

    const queue = new Queue();

    const client = new MessengerClient({
      accessToken: options.accessToken,
      appSecret: options.appSecret,
      consumeInterval: options.consumeInterval,
    });

    const engine = new Engine(MESSENGER, queue, renderer, client);

    super(controller, engine, options.plugins);

    this.receiver = new WebhookReceiver(
      handleWebhook(options),
      this.eventHandler()
    );

    this.client = client;
    this.options = options;
  }

  createMessageCreatives(node: MachinatNode) {
    return this.deliver(MESSAGE_CREATIVES_THREAD, node);
  }
}
