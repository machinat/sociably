// @flow
import invariant from 'invariant';

import { Emitter, Controller, Engine, resolvePlugins } from 'machinat-base';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook-receiver';

import type { MachinatNode } from 'machinat/types';
import type { MachinatBot } from 'machinat-base/types';
import type { WebhookMetadata } from 'machinat-webhook-receiver/types';
import type { HTTPRequestReceivable } from 'machinat-http-adaptor/types';

import MessengerWorker from './worker';
import { handleWebhook, handleResponses } from './webhookHandler';
import generalComponentDelegate from './component/general';

import { MESSENGER_NATIVE_TYPE } from './constant';
import MessengerChannel from './channel';
import { createChatJobs, createCreativeJobs } from './job';

import type {
  MessengerSource,
  MessengerBotOptions,
  MessengerEvent,
  MessengerResponse,
  MessengerComponent,
  MessengerJob,
  MessengerAPIResult,
  MessengerSegmentValue,
  MessengerSendOptions,
  BroadcastOptions,
} from './types';

type MessengerBotOptionsInput = $Shape<MessengerBotOptions>;

type MessengerReceiver = WebhookReceiver<
  MessengerChannel,
  MessengerEvent,
  MessengerResponse
>;

const MESSENGER = 'messenger';
const POST = 'POST';

export default class MessengerBot
  extends Emitter<
    MessengerChannel,
    MessengerEvent,
    WebhookMetadata,
    MessengerSegmentValue,
    MessengerComponent,
    MessengerJob,
    MessengerAPIResult
  >
  implements
    HTTPRequestReceivable<MessengerReceiver>,
    MachinatBot<
      MessengerChannel,
      MessengerEvent,
      WebhookMetadata,
      MessengerResponse,
      MessengerSegmentValue,
      MessengerComponent,
      MessengerJob,
      MessengerAPIResult,
      MessengerBotOptionsInput,
      MessengerSendOptions
    > {
  options: MessengerBotOptions;
  receiver: MessengerReceiver;

  controller: Controller<
    MessengerChannel,
    MessengerEvent,
    WebhookMetadata,
    MessengerResponse,
    MessengerSegmentValue,
    MessengerComponent
  >;

  engine: Engine<
    MessengerChannel,
    MessengerSegmentValue,
    MessengerComponent,
    MessengerJob,
    MessengerAPIResult
  >;

  worker: MessengerWorker;

  constructor(optionsInput: MessengerBotOptionsInput = {}) {
    super();

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
    this.options = options;

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

    const { eventMiddlewares, dispatchMiddlewares } = resolvePlugins(
      this,
      options.plugins
    );

    this.controller = new Controller(MESSENGER, this, eventMiddlewares);
    this.receiver = new WebhookReceiver(
      handleWebhook(options),
      handleResponses()
    );

    this.receiver.bindIssuer(
      this.controller.eventIssuerThroughMiddlewares(this.emitEvent.bind(this)),
      this.emitError.bind(this)
    );

    const renderer = new Renderer(
      MESSENGER,
      MESSENGER_NATIVE_TYPE,
      generalComponentDelegate
    );

    const queue = new Queue();
    const worker = new MessengerWorker({
      accessToken: options.accessToken,
      appSecret: options.appSecret,
      consumeInterval: options.consumeInterval,
    });

    this.engine = new Engine(
      MESSENGER,
      this,
      renderer,
      queue,
      worker,
      dispatchMiddlewares
    );
  }

  async send(
    target: string | MessengerSource | MessengerChannel,
    messages: MachinatNode,
    options?: MessengerSendOptions
  ): Promise<null | MessengerAPIResult[]> {
    const channel =
      target instanceof MessengerChannel
        ? target
        : new MessengerChannel(
            typeof target === 'string' ? { id: target } : target
          );

    const tasks = await this.engine.renderTasks(
      createChatJobs,
      channel,
      messages,
      options,
      true
    );

    if (tasks === null) {
      return null;
    }

    const response = await this.engine.dispatch(null, tasks, messages);
    return response === null ? null : response.results;
  }

  async createMessageCreative(
    messages: MachinatNode
  ): Promise<null | MessengerAPIResult> {
    const tasks = await this.engine.renderTasks(
      createCreativeJobs,
      null,
      messages,
      undefined,
      false
    );

    if (tasks === null) {
      return null;
    }

    const response = await this.engine.dispatch(null, tasks, messages);
    return response === null ? null : response.results[0];
  }

  async broadcastMessage(creativeId: number, options?: BroadcastOptions) {
    const job = {
      request: {
        relative_url: 'me/broadcast_messages',
        method: POST,
        body: {
          messaging_type: 'MESSAGE_TAG',
          tag: 'NON_PROMOTIONAL_SUBSCRIPTION',
          message_creative_id: creativeId,
          notification_type: options && options.notificationType,
          persona_id: options && options.personaId,
          custom_label_id: options && options.customLabelId,
        },
      },
    };

    const response = await this.engine.dispatch(null, [
      { type: 'transmit', payload: [job] },
    ]);

    return response === null ? null : response.results[0];
  }

  async createCustomLabel(name: string): Promise<null | MessengerAPIResult> {
    const job = {
      request: {
        relative_url: 'me/custom_labels',
        method: POST,
        body: { name },
      },
    };

    const response = await this.engine.dispatch(null, [
      { type: 'transmit', payload: [job] },
    ]);

    return response === null ? null : response.results[0];
  }
}
