// @flow
import { parse as parseUrl } from 'url';
import { join as joinPath } from 'path';
import { STATUS_CODES } from 'http';
import type { IncomingMessage, ServerResponse } from 'http';
import { BaseReceiver } from 'machinat-base';
import type { HTTPRequestReceiver } from 'machinat-http-adaptor/types';
import type {
  NextChannel,
  NextEvent,
  NextMetadata,
  NextPesponse,
  NextBotOptions,
} from './types';

const NEXT_SERVER_CHANNEL = {
  platform: 'next',
  type: 'server',
  uid: 'next:server',
};

type ParsedURL = $Call<typeof parseUrl, string>;

class NextReceiver
  extends BaseReceiver<NextChannel, NextEvent, NextMetadata, NextPesponse>
  implements HTTPRequestReceiver {
  _basePath: string;
  _next: Object;
  _defaultHandler: (
    req: IncomingMessage,
    res: ServerResponse,
    parsed: ParsedURL
  ) => Promise<void>;

  _preparing: void | Promise<void>;

  constructor(options: NextBotOptions) {
    super();

    this._basePath = options.basePath
      ? options.basePath.replace(/\/$/, '')
      : '';
    this._next = options.nextApp;
    this._defaultHandler = this._next.getRequestHandler();

    if (this._basePath !== '') {
      this._next.setAssetPrefix(
        joinPath(this._next.renderOpts.assetPrefix, this._basePath)
      );
    }

    if (!options.noPrepare) {
      this._preparing = this._next
        .prepare()
        .then(() => {
          this._preparing = undefined;
        })
        .catch(this._issueError);
    }
  }

  handleRequest(req: IncomingMessage, res: ServerResponse) {
    this._handleRequestImpl(req, res);
  }

  callback() {
    return this.handleRequest.bind(this);
  }

  async _handleRequestImpl(req: IncomingMessage, res: ServerResponse) {
    if (this._preparing !== undefined) {
      res.statusCode = 503; // eslint-disable-line no-param-reassign
      res.end(STATUS_CODES[503]);
      return;
    }

    const parsedUrl = parseUrl(req.url, true);
    const { pathname, query } = parsedUrl;

    try {
      if (!this.isBound) {
        res.statusCode = 501;
        await this._next.renderError(null, req, res, pathname, query);
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
        await this._next.render(
          req,
          res,
          response.page,
          response.query,
          parsedUrl
        );
      } else {
        if (!pathname || pathname.indexOf(this._basePath) !== 0) {
          res.statusCode = 404;
          await this._next.renderError(null, req, res, pathname, query);
          return;
        }

        await this._defaultHandler(req, res, {
          ...parsedUrl,
          pathname: pathname.slice(this._basePath.length) || '/',
        });
      }
    } catch (err) {
      this._issueError(err);
      await this._next.renderError(err, req, res, pathname, query);
    }
  }
}

export default NextReceiver;
