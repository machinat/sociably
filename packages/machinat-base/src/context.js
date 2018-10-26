// @flow
import invariant from 'invariant';

export default class MachinatContext {
  constructor(event, client, response, httpContext) {
    this.event = event;
    this.client = client;
    this.response = response;
    this.httpContext = httpContext;
  }

  respond(status, body) {
    const { response } = this;

    invariant(
      this.event.shouldRespond,
      'unexpected constex.respond() call on event which not shouldRespond'
    );

    response.status = status;
    response.body = body;
  }

  reply(nodes, options) {
    return this.client.send(this.event.thread, nodes, options);
  }
}
