// @flow
import url from 'url';
import crypto from 'crypto';
import invariant from 'invariant';
import warning from 'warning';

import { HTTPConnector, Bot } from 'machinat-base';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';

import MessengerRenderDelegator from './delegate';
import createEvent from './event';
import Client from './client';

type MessengerBotOptions = {
  appId: ?string,
  accessToken: string,
  appSecret: ?string,
  shouldValidateEvent: boolean,
  shouldVerifyWebhook: boolean,
  verifyToken: ?string,
  respondTimeout: number,
  consumeInterval: number,
};

type MessengerBotOptionsInput = $Shape<MessengerBotOptions>;

const eventReducer = (events, rawEvent) => {
  const { messaging, stanby } = rawEvent;
  const eventBody = messaging || stanby;
  const isStandby = !!stanby;

  for (let i = 0; i < eventBody.length; i += 1) {
    events.push(createEvent(isStandby, eventBody[i]));
  }

  return events;
};

const endRes = (res, code, body) => {
  res.statusCode = code; // eslint-disable-line no-param-reassign
  res.end(body);

  return undefined;
};

const handleRequest = (options: MessengerBotOptions) => (req, res, rawBody) => {
  if (req.method === 'GET') {
    const query: { [string]: string } = (url.parse(req.url, true).query: any);

    if (!options.shouldVerifyWebhook) {
      endRes(res, 403);
    } else if (
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === options.verifyToken
    ) {
      endRes(res, 200, query['hub.challenge']);
    } else {
      endRes(res, 400);
    }

    return undefined;
  }

  if (req.method !== 'POST') {
    return endRes(res, 405);
  }

  if (rawBody === undefined) {
    return endRes(res, 400);
  }

  if (options.shouldValidateEvent) {
    const hmac = crypto.createHmac('sha1', options.appSecret);
    hmac.update(rawBody, 'utf8');
    const computedSig = `sha1=${hmac.digest('hex')}`;

    if (req.headers['x-hub-signature'] !== computedSig) {
      return endRes(res, 401);
    }
  }

  let body;
  try {
    body = JSON.parse((rawBody: any));
  } catch (e) {
    if (e instanceof SyntaxError) {
      return endRes(res, 400);
    }
    throw e;
  }

  if (body.object !== 'page' || !body.entry) {
    return endRes(res, 404);
  }

  return body.entry.reduce(eventReducer, []);
};

export default class MessengerBot extends Bot<Client> {
  options: MessengerBotOptions;

  constructor(optionsInput: MessengerBotOptionsInput = {}) {
    const defaultOpions: MessengerBotOptionsInput = {
      appId: undefined,
      appSecret: undefined,
      accessToken: undefined,
      shouldValidateEvent: false,
      shouldVerifyWebhook: false,
      verifyToken: undefined,
      respondTimeout: 5000,
      consumeInterval: 100,
    };

    const options = Object.assign(defaultOpions, optionsInput);

    invariant(
      options.accessToken,
      'should provide accessToken to send messenge'
    );

    invariant(
      !options.shouldValidateEvent || options.appSecret,
      'should provide appSecret if shouldValidateEvent set to true'
    );

    warning(
      options.appSecret,
      'provide the appSecret to secure your application by attaching appsecret_proof'
    );

    invariant(
      !options.shouldVerifyWebhook || options.verifyToken,
      'should provide verifyToken if shouldVerifyWebhook set to true'
    );

    const renderer = new Renderer('Messneger', MessengerRenderDelegator);
    const queue = new Queue();

    const client = new Client(queue, renderer, {
      accessToken: options.accessToken,
      appSecret: options.appSecret,
      consumeInterval: options.consumeInterval,
    });
    const connector = new HTTPConnector(client, handleRequest(options));

    super(client, connector);

    this.client.startConsumingJob();
    this.options = options;
  }
}
