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
import { handleWebhook, handleResponses } from './webhook';
import generalComponentDelegate from './component/general';

import { MESSENGER, MESSENGER_NATIVE_TYPE } from './constant';
import MessengerChannel from './channel';
import {
  createChatJobs,
  createCreativeJobs,
  createAttachmentJobs,
} from './job';

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
} from './types';

type MessengerBotOptionsInput = $Shape<MessengerBotOptions>;

type MessengerReceiver = WebhookReceiver<
  MessengerChannel,
  MessengerEvent,
  MessengerResponse
>;

export default class MessengerBot
  extends Emitter<
    MessengerChannel,
    MessengerEvent,
    WebhookMetadata,
    MessengerSegmentValue,
    MessengerComponent,
    MessengerJob,
    MessengerAPIResult,
    MessengerSendOptions
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
      MessengerSendOptions,
      MessengerBotOptionsInput
    > {
  options: MessengerBotOptions;
  receiver: MessengerReceiver;

  controller: Controller<
    MessengerChannel,
    MessengerEvent,
    WebhookMetadata,
    MessengerResponse,
    MessengerSegmentValue,
    MessengerComponent,
    MessengerSendOptions
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
      shouldValidateRequest: true,
      shouldVerifyWebhook: true,
      respondTimeout: 5000,
    };

    const options = Object.assign(defaultOpions, optionsInput);

    invariant(
      options.pageId,
      'should provide pageId as the identification of resources'
    );

    invariant(
      options.accessToken,
      'should provide accessToken to send messages'
    );

    invariant(
      !options.shouldValidateRequest || options.appSecret,
      'should provide appSecret if shouldValidateRequest set to true'
    );

    invariant(
      !options.shouldVerifyWebhook || options.verifyToken,
      'should provide verifyToken if shouldVerifyWebhook set to true'
    );

    this.options = options;

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
            typeof target === 'string' ? { id: target } : target,
            this.options.pageId
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
    return response.results;
  }

  async createAttachment(
    node: MachinatNode
  ): Promise<null | MessengerAPIResult> {
    const tasks = await this.engine.renderTasks(
      createAttachmentJobs,
      null,
      node,
      undefined,
      false
    );

    if (tasks === null) {
      return null;
    }

    const response = await this.engine.dispatch(null, tasks, node);
    return response.results[0];
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
    return response.results[0];
  }

  async dispatchAPICall(
    method: 'GET' | 'POST' | 'DELETE',
    relativeURL: string,
    body?: Object
  ): Promise<MessengerAPIResult> {
    const response = await this.engine.dispatch(null, [
      {
        type: 'transmit',
        payload: [
          {
            request: {
              method,
              relative_url: relativeURL,
              body,
            },
          },
        ],
      },
    ]);

    return response.results[0];
  }
}
