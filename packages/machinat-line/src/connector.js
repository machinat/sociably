import EventEmitter from 'events';
import invariant from 'invariant';
import warning from 'warning';
import getRawBody from 'raw-body';
import thenifiedly from 'thenifiedly';

import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';

import createEvent from './event';
import Client from './client';
import LineDelegator from './delegate';
import Context from './context';

const RAW_BODY_OPTION = { encoding: true };

const endResponse = thenifiedly.callMethodFactory('end');

export default class LineConnector extends EventEmitter {
  constructor({ channelSecret, accessToken, ...options } = {}) {
    super();
    this.channelSecret = channelSecret;
    this.accessToken = accessToken;

    warning(this.accessToken, 'should provide accessToken to send messenge');

    const defaultOpions = {
      useReplyAPI: false,
      shouldValidateEvent: false,
      consumeInterval: 100,
    };
    this.options = Object.assign(defaultOpions, options);

    invariant(
      !this.options.shouldValidateEvent || this.channelSecret,
      'should provide channelSecret if shouldValidateEvent set to true'
    );

    this.renderer = new Renderer(
      'LINE',
      LineDelegator(this.options.useReplyAPI)
    );
    this.queue = new Queue();
    this.client = new Client(accessToken, this.queue, {
      consumeInterval: this.options.consumeInterval,
    });

    this.client.startConsumingJob();
  }

  async send(source, nodes, options) {
    invariant(!this.options.useReplyAPI || (options && options.replyToken));
    let thread = source;
    if (typeof thread === 'string') {
      thread = { userId: source };
    }

    const sequence = this.renderer.renderJobSequence(nodes, {
      thread,
      options,
    });

    const result = await this.queue.executeJobSequence(sequence);
    return result;
  }

  async handleRequest(req, res, parsedBody) {
    try {
      let body = parsedBody;
      if (body === undefined) {
        const rawBody = await getRawBody(req, RAW_BODY_OPTION);
        body = JSON.parse(rawBody);
      }

      if (this.options.shouldValidateEvent) {
        // TODO: validate the req
      }

      invariant(
        body.events !== undefined,
        `invalid webhook request body:\n${JSON.stringify(body)}`
      );

      const events = body.events.map(createEvent);
      events.forEach(this._emitEvent);
    } finally {
      await endResponse(res);
    }
  }

  _emitEvent = event => this.emit('event', new Context(event, this));
}
