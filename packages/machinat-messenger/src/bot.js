// @flow
import invariant from 'invariant';

import { WebhookConnector, Bot } from 'machinat-base';

import Client from './client';
import handleWebhook from './handleWebhook';

import type { MessengerBotOptions } from './types';

type MessengerBotOptionsInput = $Shape<MessengerBotOptions>;

export default class MessengerBot extends Bot<Client> {
  options: MessengerBotOptions;

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

    const client = new Client({
      accessToken: options.accessToken,
      appSecret: options.appSecret,
      consumeInterval: options.consumeInterval,
    });

    const connector = new WebhookConnector(client, handleWebhook(options));

    super(client, connector);

    this.client.startConsumingJob();
    this.options = options;
  }
}
