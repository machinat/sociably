import { parse as parseUrl, UrlWithParsedQuery } from 'url';
import { STATUS_CODES, IncomingMessage, ServerResponse } from 'http';
import {
  maybeInjectContainer,
  makeClassProvider,
  createEmptyScope,
  ServiceScope,
} from '@machinat/core/service';
import ModuleUtilitiesI from '@machinat/core/base/ModuleUtilities';
import type { PopErrorFn } from '@machinat/core';
import type { RequestHandler } from '@machinat/http';
import { ServerI, ConfigsI } from './interface';
import type { NextServer, NextRequestHandler } from './types';

type NextReceiverOptions = {
  entryPath?: string;
  noPrepare?: boolean;
  handleRequest?: NextRequestHandler;
  initScope?: () => ServiceScope;
  popError?: PopErrorFn | null;
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

  private _requestHandler: NextRequestHandler;
  private _initScope: () => ServiceScope;
  private _popError: (err: Error) => void;

  constructor(
    nextApp: NextServer,
    {
      noPrepare,
      entryPath,
      handleRequest,
      initScope,
      popError,
    }: NextReceiverOptions
  ) {
    this._next = nextApp;
    this._defaultNextHandler = nextApp.getRequestHandler();
    this._pathPrefix = entryPath ? entryPath.replace(/\/$/, '') : '';
    this._shouldPrepare = !noPrepare;
    this._prepared = false;

    this._requestHandler = handleRequest || (() => ({ ok: true }));
    this._initScope = initScope || createEmptyScope;
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

      const response = await maybeInjectContainer(
        this._initScope(),
        this._requestHandler
      )(request);

      if (response.ok) {
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
    { require: ModuleUtilitiesI, optional: true },
  ] as const,
  factory: (nextApp, { entryPath, noPrepare, handleRequest }, moduleUtils) =>
    new NextReceiver(nextApp, {
      entryPath,
      noPrepare,
      handleRequest,
      initScope: moduleUtils?.initScope,
      popError: moduleUtils?.popError,
    }),
})(NextReceiver);

export type ReceiverP = NextReceiver;
