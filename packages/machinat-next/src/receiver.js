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
} from './types';

const NEXT_SERVER_CHANNEL = {
  platform: 'next',
  type: 'server',
  uid: 'next:server',
};

type ParsedURL = $Call<typeof parseUrl, string>;

class NextReceiver
  extends BaseReceiver<NextChannel, null, NextEvent, NextMetadata, NextPesponse>
  implements HTTPRequestReceiver {
  _basePath: string;
  _next: Object;
  _defaultHandler: (
    req: IncomingMessage,
    res: ServerResponse,
    parsed: ParsedURL
  ) => Promise<void>;

  _preparing: void | Promise<void>;

  constructor(nextApp: Object, shouldPrepare: boolean, basePath?: string) {
    super();

    this._next = nextApp;
    this._basePath = basePath ? basePath.replace(/\/$/, '') : '';
    this._defaultHandler = this._next.getRequestHandler();

    if (this._basePath !== '') {
      this._next.setAssetPrefix(
        joinPath(this._next.renderOpts.assetPrefix, this._basePath)
      );
    }

    if (shouldPrepare) {
      this._preparing = this._next
        .prepare()
        .then(() => {
          this._preparing = undefined;
        })
        .catch(err => this.issueError(err));
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

    try {
      const response = await this.issueEvent(
        NEXT_SERVER_CHANNEL,
        null,
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
        const { pathname, path, query } = parsedUrl;
        const basePath = this._basePath;

        // NOTE: next does not support serving under sub path now, so we have to
        //       hack the path by ourself.
        //       Follow https://github.com/zeit/next.js/issues/4998
        if (this._basePath !== '') {
          if (!pathname || pathname.indexOf(basePath) !== 0) {
            res.statusCode = 404;
            await this._next.renderError(null, req, res, pathname, query);
            return;
          }

          if (
            this._next.renderOpts.dev &&
            req.url.slice(0, basePath.length) === basePath
          ) {
            req.url = req.url.slice(basePath.length); // eslint-disable-line no-param-reassign
          }

          await this._defaultHandler(req, res, {
            ...parsedUrl,
            pathname: pathname.slice(basePath.length) || '/',
            path: (path: any).slice(basePath.length) || '/',
          });
        } else {
          await this._defaultHandler(req, res, parsedUrl);
        }
      }
    } catch (err) {
      this.issueError(err);

      const { pathname, query } = parsedUrl;
      await this._next.renderError(err, req, res, pathname, query);
    }
  }
}

export default NextReceiver;
