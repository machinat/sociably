// @flow
import { parse as parseUrl } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';
import { BaseReceiver } from 'machinat-base';
import type { HTTPRequestReceiver } from 'machinat-http-adaptor/types';
import type { NextEvent, NextMetadata, NextPesponse } from './types';

const NEXT_SERVER_CHANNEL = {
  platform: 'next',
  type: 'server',
  uid: 'next:server',
};

export type NextChannel = typeof NEXT_SERVER_CHANNEL;

class NextReceiver
  extends BaseReceiver<NextChannel, NextEvent, NextMetadata, NextPesponse>
  implements HTTPRequestReceiver {
  _next: Object;
  _defaultHandler: (
    req: IncomingMessage,
    res: ServerResponse,
    parsed: $Call<typeof parseUrl, string>
  ) => Promise<void>;

  constructor(next: Object) {
    super();
    this._next = next;
    this._defaultHandler = next.getRequestHandler();
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

      if (response) {
        await next.render(req, res, response.pathname, response.query);
      } else {
        await this._defaultHandler(req, res, parseUrl(req.url, true));
      }
    } catch (err) {
      this._issueError(err);

      const { pathname, query } = parseUrl(req.url, true);
      await next.renderError(err, req, res, pathname, query);
    }
  }

  async _renderErrorWithCode(
    req: IncomingMessage,
    res: ServerResponse,
    code: number
  ) {
    const { pathname, query } = parseUrl(req.url, true);
    res.statusCode = code; // eslint-disable-line no-param-reassign
    await this._next.renderError(null, req, res, pathname, query);
  }
}

export default NextReceiver;
