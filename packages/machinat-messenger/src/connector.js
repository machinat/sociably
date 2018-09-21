import invariant from 'invariant';
import warning from 'warning';
import EventEmitter from 'events';
import url from 'url';

import thenifiedly from 'thenifiedly';
import getRawBody from 'raw-body';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';

import MessengerDelegator from './delegate';
import eventFactory from './event';
import Context from './context';
import Client from './client';

const endResponse = thenifiedly.callMethodFactory('end');
const shouldEventRespond = e => !!e.shouldRespond;

const RAW_BODY_OPTION = { encoding: true };

class MessengerConnector extends EventEmitter {
  constructor({ appId, appSecret, accessToken, ...options } = {}) {
    super();
    this.appId = appId;
    this.appSecret = appSecret;
    this.accessToken = accessToken;

    warning(this.accessToken, 'should provide accessToken to send messenge');

    const defaultOpions = {
      shouldValidateEvent: false,
      shouldVerifyWebhook: false,
      verifyToken: null,
      respondTimeout: 5000,
      consumeInterval: 100,
    };
    this.options = Object.assign(defaultOpions, options);

    invariant(
      !this.options.shouldValidateEvent || this.appSecret,
      'should provide appSecret if shouldValidateEvent set to true'
    );

    invariant(
      !this.options.shouldVerifyWebhook || this.options.verifyToken,
      'should provide verifyToken if shouldVerifyWebhook set to true'
    );

    this.renderer = new Renderer('Messneger', MessengerDelegator);
    this.queue = new Queue();
    this.client = new Client(accessToken, this.queue, {
      consumeInterval: this.options.consumeInterval,
    });

    this.client.startConsumingBatchJob();
  }

  async send(recipient, nodes, options) {
    let thread = recipient;
    if (typeof thread === 'string') {
      thread = { id: recipient };
    }

    const sequence = this.renderer.renderJobSequence(nodes, {
      thread,
      options,
    });

    const result = await this.queue.executeJobSequence(sequence);
    return result;
  }

  callback() {
    return this.handleRequest.bind(this);
  }

  async handleRequest(req, res, parsedBody) {
    if (req.method === 'GET') {
      if (!this.options.shouldVerifyWebhook) {
        return;
      }

      // NOTE: WHATWG api not able to parse partial URL, use classic.
      //       https://github.com/nodejs/node/issues/12682
      const { query } = url.parse(req.url, true);
      if (
        query['hub.mode'] === 'subscribe' &&
        query['hub.verify_token'] === this.options.verifyToken
      ) {
        await endResponse(res, query['hub.challenge']);
      } else {
        res.writeHead(403);
        await endResponse(res);
      }
      return;
    }

    let body = parsedBody;
    if (body === undefined) {
      const rawBody = await getRawBody(req, RAW_BODY_OPTION);
      body = JSON.parse(rawBody);
    }

    if (body.object !== 'page') {
      await endResponse(res);
      return;
    }

    invariant(
      body.entry !== undefined,
      `invalid webhook event body:\n${JSON.stringify(body)}`
    );

    if (this.options.shouldValidateEvent) {
      // ... validate the req
    }

    const events = eventFactory(body.entry);
    events.forEach(this._emitEvent);

    if (events.findIndex(shouldEventRespond) !== -1) {
      // waitForRespond
    } else {
      await endResponse(res);
    }
  }

  _emitEvent = e => this.emit('event', new Context(e, this));
}

export default MessengerConnector;
