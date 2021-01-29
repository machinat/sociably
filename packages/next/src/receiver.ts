import { parse as parseUrl, UrlWithParsedQuery } from 'url';
import { STATUS_CODES, IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@machinat/core/service';

import type { PopEventWrapper, PopErrorFn } from '@machinat/core/types';
import type { RequestHandler } from '@machinat/http/types';
import { ServerI, ConfigsI, PlatformMounterI } from './interface';
import type { NextServer, NextEventContext, NextResponse } from './types';

type NextReceiverOptions = {
  entryPath?: string;
  noPrepare?: boolean;
};

/**
 * @category Provider
 */
export class NextReceiver {
  private _next: NextServer;
  private _defaultNextHandler: (
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl: UrlWithParsedQuery
  ) => void;

  private _pathPrefix: string;
  private _shouldPrepare: boolean;
  private _prepared: boolean;

  private _popEvent: (ctx: NextEventContext) => Promise<NextResponse>;
  private _popError: (err: Error) => void;

  constructor(
    nextApp: NextServer,
    { noPrepare, entryPath }: NextReceiverOptions,
    popEventWrapper:
      | PopEventWrapper<NextEventContext, NextResponse>
      | null
      | undefined,
    popError?: PopErrorFn | null
  ) {
    this._next = nextApp;
    this._defaultNextHandler = nextApp.getRequestHandler();
    this._pathPrefix = entryPath ? entryPath.replace(/\/$/, '') : '';
    this._shouldPrepare = !noPrepare;
    this._prepared = false;

    const finalHandler = () => Promise.resolve({ accepted: true as const });

    this._popEvent = popEventWrapper
      ? popEventWrapper(finalHandler)
      : finalHandler;
    this._popError =
      popError ||
      (() => {
        // do nothing
      });
  }

  async prepare(): Promise<void> {
    if (this._shouldPrepare) {
      await this._next.prepare();
    }
    this._prepared = true;
  }

  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    this._handleRequestImpl(req, res).catch(this._popError);
  }

  handleRequestCallback(): RequestHandler {
    return this.handleRequest.bind(this);
  }

  private async _handleRequestImpl(req: IncomingMessage, res: ServerResponse) {
    if (!this._prepared) {
      res.statusCode = 503; // eslint-disable-line no-param-reassign
      res.end(STATUS_CODES[503]);
      return;
    }

    const parsedUrl = parseUrl(req.url as string, true);
    const pathPrefix = this._pathPrefix;

    const { pathname } = parsedUrl;
    const trimedPath = !pathname
      ? undefined
      : pathPrefix === ''
      ? pathname
      : pathname.indexOf(pathPrefix) === 0
      ? pathname.slice(pathPrefix.length) || '/'
      : undefined;

    if (!trimedPath) {
      res.statusCode = 404;
      await this._next.renderError(
        null,
        req,
        res,
        pathname as string,
        parsedUrl.query
      );
      return;
    }

    const parsedUrlWithPathPrefixTrimed = {
      ...parsedUrl,
      pathname: trimedPath,
      path: (parsedUrl.path as string).slice(pathPrefix.length) || '/',
    };

    if (trimedPath.slice(1, 6) === '_next') {
      if (this._next.renderOpts.dev && pathPrefix !== '') {
        // HACK: to make react hot loader server recognize the request in
        //       dev environment
        // eslint-disable-next-line no-param-reassign
        req.url = trimedPath;
      }

      this._defaultNextHandler(req, res, parsedUrlWithPathPrefixTrimed);
      return;
    }

    try {
      const request = {
        method: req.method as string,
        url: req.url as string,
        headers: req.headers,
      };

      const response = await this._popEvent({
        platform: 'next',
        event: {
          platform: 'next',
          kind: 'request',
          type: 'request',
          payload: { request },
          channel: null,
          user: null,
        },
        metadata: { source: 'next', request },
        bot: null,
      });

      if (response.accepted) {
        const { page, query, headers } = response;
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value as string);
          }
        }

        if (page || query) {
          await this._next.render(
            req,
            res,
            page || trimedPath,
            query || parsedUrl.query,
            parsedUrlWithPathPrefixTrimed
          );
        } else {
          this._defaultNextHandler(req, res, parsedUrlWithPathPrefixTrimed);
        }
      } else {
        const { code, reason, headers } = response;
        res.writeHead(code, headers);
        await this._next.renderError(
          new Error(reason),
          req,
          res,
          trimedPath,
          parsedUrl.query
        );
      }
    } catch (err) {
      this._popError(err);

      res.statusCode = 500;
      await this._next.renderError(err, req, res, trimedPath, parsedUrl.query);
    }
  }
}

export const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    ServerI,
    ConfigsI,
    { require: PlatformMounterI, optional: true },
  ] as const,
  factory: (nextApp, configs, mounter) =>
    new NextReceiver(
      nextApp,
      configs,
      mounter?.popEventWrapper,
      mounter?.popError
    ),
})(NextReceiver);

export type ReceiverP = NextReceiver;
