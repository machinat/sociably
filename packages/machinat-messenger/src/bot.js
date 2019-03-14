// @flow
import invariant from 'invariant';

import { BaseBot, Engine, Controller } from 'machinat-base';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook';

import type { MachinatNode } from 'machinat/types';
import type { WebhookResponse } from 'machinat-webhook/types';
import type { HTTPReceivable, HTTPReceiver } from 'machinat-http/types';

import MessengerClient from './client';
import handleWebhook from './handleWebhook';
import {
  ChatThread,
  MESSAGE_CREATIVES_THREAD,
  BROADCAST_MESSAGES_THREAD,
  CREATE_LABELS_THREAD,
} from './thread';
import { MESSENGER_NAITVE_TYPE } from './symbol';
import * as generalComponents from './component/general';

import type {
  Recipient,
  MessengerBotOptions,
  MessengerEvent,
  MessengerComponent,
  MessengerJob,
  MessengerAPIResult,
  MessengerActionValue,
  SendOptions,
  BroadcastOptions,
  DeliverableThread,
} from './types';

type MessengerBotOptionsInput = $Shape<MessengerBotOptions>;

const MESSENGER = 'messenger';

// $FlowFixMe https://github.com/facebook/flow/issues/7539
export default class MessengerBot
  extends BaseBot<
    MessengerActionValue,
    MessengerComponent,
    MessengerJob,
    MessengerAPIResult,
    DeliverableThread,
    WebhookResponse,
    ChatThread,
    MessengerEvent
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

    const engine = new Engine(MESSENGER, queue, renderer);
    const receiver = new WebhookReceiver(handleWebhook(options));

    super(receiver, controller, engine, client, options.plugins);

    this.client = client;
    this.options = options;
  }

  send(
    target: string | Recipient,
    message: MachinatNode,
    options?: SendOptions
  ): Promise<null | MessengerAPIResult[]> {
    const thread = new ChatThread(
      typeof target === 'string' ? { id: target } : target
    );

    return this.engine.dispatch(thread, message, options);
  }

  async createMessageCreative(node: MachinatNode) {
    const results = await this.engine.dispatch(MESSAGE_CREATIVES_THREAD, node);
    return results && results[0];
  }

  async broadcastMessage(creativeId: number, options?: BroadcastOptions) {
    const results = await this.engine.dispatch(
      BROADCAST_MESSAGES_THREAD,
      null,
      {
        message_creative_id: creativeId,
        notification_type: options && options.notificationType,
        persona_id: options && options.personaId,
        custom_label_id: options && options.customLabelId,
      }
    );

    return results && results[0];
  }

  async createCustomLabel(name: string) {
    const results = await this.engine.dispatch(CREATE_LABELS_THREAD, null, {
      name,
    });

    return results && results[0];
  }
}
