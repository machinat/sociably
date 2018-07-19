import EventEmitter from 'events';
import getRawBody from 'raw-body';
import eventFactory from './event';
import Context from './context';

const RAW_BODY_OPTION = { encoding: true };

class MessengerConnector extends EventEmitter {
  constructor({ appId, appSecret, shouldValidate, respondTimeout }) {
    super();
    this.appId = appId;
    this.appSecret = appSecret;
    this.shouldValidate = shouldValidate;
    this.respondTimeout = respondTimeout;
  }

  async _handleRequest(request, response, parsedBody) {
    let body = parsedBody;
    if (!body) {
      const rawBody = await getRawBody(request, RAW_BODY_OPTION);
      body = JSON.parse(rawBody);
    }

    if (!body.entry) {
      throw new Error(
        `invalid webhook event body:\n${JSON.stringify(body, null, 2)}`
      );
    }

    if (!body.obejct === 'page') {
      throw new Error(
        `non "page" webhook event received:\n${JSON.stringify(body, null, 2)}`
      );
    }

    if (this.shouldValidate) {
      // ... validate the request
    }

    const events = eventFactory(body.entry);
    events.forEach(e => this.emit('event', new Context(e)));

    // const shouldRespond = events.findIndex(e => e.shouldRespond) !== -1;
    // if (shouldRespond) {
    //   respondTimeout;
    // }
    // return responseContent;
  }
}

export default MessengerConnector;
