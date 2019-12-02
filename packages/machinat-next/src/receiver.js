// @flow
import { parse as parseURL } from 'url';
import { join as joinPath } from 'path';
import { STATUS_CODES } from 'http';
import type { IncomingMessage, ServerResponse } from 'http';
import { BaseReceiver } from 'machinat-base';
import type { HTTPRequestReceiver } from 'machinat-http-adaptor/types';
import type {
  NextChannel,
  NextEvent,
  NextMetadata,
  NextResponse,
} from './types';

const NEXT_SERVER_CHANNEL = {
  platform: 'next',
  type: 'server',
  uid: 'next:server',
};

type ParsedURL = $Call<typeof parseURL, string>;

class NextReceiver
  extends BaseReceiver<NextChannel, null, NextEvent, NextMetadata, NextResponse>
  implements HTTPRequestReceiver {
  _basePath: string;
  _next: Object;
  _defaultHandler: (
    req: IncomingMessage,
    res: ServerResponse,
    parsed: ParsedURL
  ) => Promise<void>;

  _preparingPromise: ?Promise<void>;

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
      this._preparingPromise = this._next
        .prepare()
        .then(() => {
          this._preparingPromise = null;
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
    if (this._preparingPromise) {
      res.statusCode = 503; // eslint-disable-line no-param-reassign
      res.end(STATUS_CODES[503]);
      return;
    }

    const parsedURL = parseURL(req.url, true);

    const trimedPath = this._trimBasePath(parsedURL.pathname);
    if (!trimedPath) {
      res.statusCode = 404;
      await this._next.renderError(
        null,
        req,
        res,
        parsedURL.pathname,
        parsedURL.query
      );
      return;
    }

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

      if (res.finished) {
        return;
      }

      const basePath = this._basePath;

      if (response.accepted) {
        if (this._next.renderOpts.dev && basePath !== '') {
          // HACK: to make react hot loader server recognize the request in
          //       dev environment
          // eslint-disable-next-line no-param-reassign
          req.url = trimedPath;
        }

        const { page, query } = response;

        if (page || query) {
          await this._next.render(
            req,
            res,
            page || trimedPath,
            query || parsedURL.query,
            parsedURL
          );
        } else {
          await this._defaultHandler(
            req,
            res,
            basePath
              ? {
                  ...parsedURL,
                  pathname: trimedPath,
                  path: (parsedURL.path: any).slice(basePath.length) || '/',
                }
              : parsedURL
          );
        }
      } else {
        const { code, message } = response;
        res.statusCode = code;
        await this._next.renderError(
          new Error(message),
          req,
          res,
          trimedPath,
          parsedURL.query
        );
      }
    } catch (err) {
      this.issueError(err);

      res.statusCode = 500;
      await this._next.renderError(err, req, res, trimedPath, parsedURL.query);
    }
  }

  _trimBasePath(pathname: ?string): void | string {
    const basePath = this._basePath;
    return !pathname
      ? undefined
      : basePath === ''
      ? pathname
      : pathname.indexOf(basePath) === 0
      ? pathname.slice(basePath.length) || '/'
      : undefined;
  }
}

export default NextReceiver;
