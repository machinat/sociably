// @flow
import invariant from 'invariant';

import { Bot, WebhookConnector } from 'machinat-base';

import Client from './client';
import handleWebhook from './handleWebhook';

import type { LineBotOptions } from './types';

type LineBotOptionsInput = $Shape<LineBotOptions>;

export default class LineBot extends Bot<Client> {
  options: LineBotOptions;

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

    const client = new Client(options);
    const connector = new WebhookConnector(client, handleWebhook(options));

    super(client, connector);

    this.client.startConsumingJob();

    this.options = options;
  }
}
