import url from 'url';
import invariant from 'invariant';
import warning from 'warning';

import { BaseConnector } from 'machinat-base';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';

import MessengerDelegator from './delegate';
import createEvent from './event';
import Client from './client';

const eventReducer = (events, rawEvent) => {
  const { messaging, stanby } = rawEvent;
  const eventBody = messaging || stanby;
  const isStandby = !!stanby;

  for (let i = 0; i < eventBody.length; i += 1) {
    events.push(createEvent(isStandby, eventBody[i]));
  }
  return events;
};

export default class MessengerConnector extends BaseConnector {
  constructor({ appId, appSecret, accessToken, ...options } = {}) {
    const defaultOpions = {
      shouldValidateEvent: false,
      shouldVerifyWebhook: false,
      verifyToken: null,
      respondTimeout: 5000,
      consumeInterval: 100,
    };

    const refinedOptions = Object.assign(defaultOpions, options);

    const renderer = new Renderer('Messneger', MessengerDelegator);
    const queue = new Queue();
    const client = new Client(queue, renderer, {
      accessToken,
      appSecret,
      consumeInterval: refinedOptions.consumeInterval,
    });

    super(client);

    this.client.startConsumingJob();

    this.appId = appId;
    this.appSecret = appSecret;
    this.options = refinedOptions;

    warning(accessToken, 'should provide accessToken to send messenge');

    warning(
      this.appSecret,
      'provide the appSecret to secure your application by attaching appsecret_proof'
    );

    invariant(
      !this.options.shouldValidateEvent || this.appSecret,
      'should provide appSecret if shouldValidateEvent set to true'
    );

    invariant(
      !this.options.shouldVerifyWebhook || this.options.verifyToken,
      'should provide verifyToken if shouldVerifyWebhook set to true'
    );
  }

  callback() {
    return this.handleRequest.bind(this);
  }

  handleRequest(req, res, body) {
    if (req.method === 'GET') {
      // NOTE: WHATWG api not able to parse partial URL, use classic.
      //       https://github.com/nodejs/node/issues/12682
      const { query } = url.parse(req.url, true);
      if (
        this.options.shouldVerifyWebhook &&
        query['hub.mode'] === 'subscribe' &&
        query['hub.verify_token'] === this.options.verifyToken
      ) {
        res.end(query['hub.challenge']);
      } else {
        res.statusCode = 403; // eslint-disable-line no-param-reassign
        res.end();
      }
      return undefined;
    }

    if (this.options.shouldValidateEvent) {
      // TODO: validate the req
    }

    if (body.object !== 'page') {
      warning(false, `non page webhook received:\n${JSON.stringify(body)}`);
      return undefined;
    }

    invariant(
      body.entry !== undefined,
      `invalid webhook event body:\n${JSON.stringify(body)}`
    );

    return body.entry.reduce(eventReducer, []);
  }
}
