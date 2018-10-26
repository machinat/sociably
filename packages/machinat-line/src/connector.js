import invariant from 'invariant';
import warning from 'warning';

import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';
import { BaseConnector } from 'machinat-base';

import createEvent from './event';
import Client from './client';
import LineDelegator from './delegate';

export default class LineConnector extends BaseConnector {
  constructor({ channelSecret, accessToken, ...options } = {}) {
    const defaultOpions = {
      useReplyAPI: false,
      shouldValidateEvent: false,
      consumeInterval: 100,
    };
    const refinedOptions = Object.assign(defaultOpions, options);

    const queue = new Queue();
    const renderer = new Renderer(
      'LINE',
      LineDelegator(refinedOptions.useReplyAPI)
    );

    super(new Client(queue, renderer, { accessToken, ...refinedOptions }));

    this.client.startConsumingJob();

    this.channelSecret = channelSecret;
    this.options = refinedOptions;

    warning(accessToken, 'should provide accessToken to send messenge');

    invariant(
      !this.options.shouldValidateEvent || this.channelSecret,
      'should provide channelSecret if shouldValidateEvent set to true'
    );
  }

  handleRequest(req, res, body) {
    if (this.options.shouldValidateEvent) {
      // TODO: validate the req
    }

    invariant(
      body.events !== undefined,
      `invalid webhook request body:\n${JSON.stringify(body)}`
    );

    return body.events.map(createEvent);
  }
}
