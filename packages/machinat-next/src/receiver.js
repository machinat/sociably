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
    const { pathname, query } = url.parse(req.url, true);

    try {
      if (!this.isBound) {
        res.statusCode = 501; // eslint-disable-line no-param-reassign
        await next.renderError(null, req, res, pathname, query);
        return;
      }

      const response = await this._issueEvent(
        NEXT_SERVER_CHANNEL,
        {
          platform: 'next',
          type: 'request',
          payload: {
            pathname: pathname || '',
            query: query || {},
          },
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
        res.statusCode = 501; // eslint-disable-line no-param-reassign
        await next.renderError(null, req, res, pathname, query);
        return;
      }

      await next.render(req, res, response.pathname, response.query);
    } catch (err) {
      this._issueError(err);
      await next.renderError(err, req, res, pathname, query);
    }
  }
}

export default NextReceiver;
