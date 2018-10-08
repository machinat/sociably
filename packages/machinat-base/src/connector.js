// @flow
import EventEmitter from 'events';
import getRawBody from 'raw-body';
import compose from 'koa-compose';
import thenifiedly from 'thenifiedly';

import Context from './context';

const RAW_BODY_OPTION = { encoding: true };

type MiddlewareFunc = (Object, () => Promise<void>) => void;

const endResponse = thenifiedly.callMethodFactory('end');
const shouldEventRespond = e => !!e.shouldRespond;

export default class MachinatBaseConnector extends EventEmitter {
  middlewares: Array<MiddlewareFunc>;
  constructor(client) {
    super();
    this.middlewares = [];
    this.client = client;

    this.client.startConsumingJob();
  }

  use(fn: MiddlewareFunc) {
    if (typeof fn !== 'function')
      throw new TypeError('middleware must be a function!');
    this.middlewares.push(fn);
  }

  handleWebhook() {
    const fn = compose(this.middlewares);

    const handleWebhook = async (req, res, parsedBody) => {
      let body = parsedBody;
      if (body === undefined && req.method !== 'GET') {
        const rawBody = await getRawBody(req, RAW_BODY_OPTION);
        body = JSON.parse(rawBody);
      }

      const events = this.handleRequest(req, res, body);
      if (events === undefined) {
        if (!res.finished) await endResponse(res);
        return;
      }

      let response = null;
      if (events.findIndex(shouldEventRespond) !== -1) {
        response = { status: 200, body: undefined };
      } else {
        await endResponse(res);
      }

      const midddlewarePromises = new Array(events.length);

      for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        this.emit('event', event);

        const context = new Context(event, this.client, response);
        midddlewarePromises[i] = fn(context);
      }

      await Promise.all(midddlewarePromises);

      if (response !== null) {
        res.writeHead(response.status);
        res.end(JSON.stringify(response.body));
      }
    };

    return handleWebhook;
  }

  // eslint-disable-next-line class-methods-use-this
  handleRequest() {
    throw new ReferenceError('calling to handleRequest() of base connector');
  }
}
