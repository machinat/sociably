// @flow
import url from 'url';
import type { IncomingMessage, ServerResponse } from 'http';
import { BaseReceiver } from 'machinat-base';
import type { HTTPRequestReceiver } from 'machinat-http-adaptor/types';
import type { NextEvent, NextMetadata, NextParams } from './types';

const NEXT_SERVER_CHANNEL = {
  platform: 'next',
  type: 'server',
  uid: 'next:server',
};

export type NextChannel = typeof NEXT_SERVER_CHANNEL;

class NextReceiver
  extends BaseReceiver<NextChannel, NextEvent, NextMetadata, NextParams>
  implements HTTPRequestReceiver {
  _next: Object;

  constructor(next: Object) {
    super();
    this._next = next;
  }

  handleRequest(req: IncomingMessage, res: ServerResponse) {
    this._handleRequestImpl(req, res);
  }

  callback() {
    return this.handleRequest.bind(this);
  }

  async _handleRequestImpl(req: IncomingMessage, res: ServerResponse) {
    const next = this._next;

    try {
      if (!this.isBound) {
        await this._renderErrorWithCode(req, res, 501);
        return;
      }

      const response = await this._issueEvent(
        NEXT_SERVER_CHANNEL,
        {
          platform: 'next',
          type: 'request',
          payload: { req, res },
        },
        {
          source: 'next',
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            encrypted: !!(req: any).connection.encrypted,
          },
        }
      );

      if (!response) {
        await this._renderErrorWithCode(req, res, 501);
        return;
      }

      await next.render(req, res, response.pathname, response.query);
    } catch (err) {
      this._issueError(err);

      const { pathname, query } = url.parse(req.url, true);
      await next.renderError(err, req, res, pathname, query);
    }
  }

  async _renderErrorWithCode(
    req: IncomingMessage,
    res: ServerResponse,
    code: number
  ) {
    const { pathname, query } = url.parse(req.url, true);
    res.statusCode = code; // eslint-disable-line no-param-reassign
    await this._next.renderError(null, req, res, pathname, query);
  }
}

export default NextReceiver;
