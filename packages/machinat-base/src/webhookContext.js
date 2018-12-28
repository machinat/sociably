// @flow
import invariant from 'invariant';
import type { MachinatNode } from 'types/element';
import type { MachinatClient, MachinatContext, MachinatEvent } from './types';

type ResponseStore = {
  status: ?number,
  body: ?(string | Object),
};

class WebhookContext<Client: MachinatClient<any, any, any, any>>
  implements MachinatContext<Client> {
  client: Client;
  event: MachinatEvent;
  httpContext: any;
  _response: ?ResponseStore;

  source = 'http';

  constructor(
    event: MachinatEvent,
    client: Client,
    response: ?ResponseStore,
    httpContext: any
  ) {
    this.event = event;
    this.client = client;
    this._response = response;
    this.httpContext = httpContext;
  }

  get response() {
    return this._response;
  }

  respond(status: number, body: string | Object) {
    const { response } = this;

    invariant(
      this.event.shouldRespond,
      'unexpected context.respond() call on event which shouldRespond is false'
    );

    invariant(
      response && !response.status,
      `response is already set before as status ${String(
        response && response.status
      )}`
    );

    response.status = status;
    response.body = body;
  }

  reply(nodes: MachinatNode, options: Object) {
    invariant(
      this.event.thread,
      `cannot call context.reply() which context.event.thread is ${String(
        this.event.thread
      )}`
    );

    return this.client.send(this.event.thread, nodes, options);
  }
}

export default WebhookContext;
