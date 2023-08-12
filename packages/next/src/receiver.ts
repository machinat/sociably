import { parse as parseUrl } from 'url';
import { STATUS_CODES, IncomingMessage, ServerResponse } from 'http';
import { Socket as NetSocket } from 'net';
import {
  maybeInjectContainer,
  serviceProviderClass,
  createEmptyScope,
  ServiceScope,
} from '@sociably/core/service';
import ModuleUtilitiesI from '@sociably/core/base/ModuleUtilities';
import type { PopErrorFn } from '@sociably/core';
import type {
  RequestHandler,
  UpgradeHandler,
  RoutingInfo,
} from '@sociably/http';
import { ServerI, ConfigsI } from './interface.js';
import type { NextServer, NextRequestHandler } from './types.js';

type NextReceiverOptions = {
  noPrepare?: boolean;
  handleRequest?: NextRequestHandler;
  initScope?: () => ServiceScope;
  popError?: PopErrorFn | null;
};

/**
 * @category Provider
 */
export class NextReceiver {
  private nextServer: NextServer;
  private defaultNextHandler: ReturnType<NextServer['getRequestHandler']>;

  private shouldPrepare: boolean;
  private isPrepared: boolean;

  private requestHandler: NextRequestHandler;
  private initScope: () => ServiceScope;
  private popError: (err: Error) => void;

  constructor(
    nextApp: NextServer,
    { noPrepare, handleRequest, initScope, popError }: NextReceiverOptions = {}
  ) {
    this.nextServer = nextApp;
    this.defaultNextHandler = nextApp.getRequestHandler();
    this.shouldPrepare = !noPrepare;

    this.requestHandler = handleRequest || (() => ({ ok: true }));
    this.initScope = initScope || createEmptyScope;
    this.popError =
      popError ||
      (() => {
        // do nothing
      });
  }

  async prepare(): Promise<void> {
    if (this.shouldPrepare) {
      await this.nextServer.prepare();
    }
    this.isPrepared = true;
  }

  async close(): Promise<void> {
    await this.nextServer.close();
  }

  handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    routing: RoutingInfo
  ): void {
    this.handleRequestImpl(req, res, routing).catch(this.popError);
  }

  handleRequestCallback(): RequestHandler {
    return this.handleRequest.bind(this);
  }

  handleHmrUpgrade(
    req: IncomingMessage,
    socket: NetSocket,
    _head: Buffer,
    { trailingPath }: RoutingInfo
  ): void {
    if (trailingPath !== '_next/webpack-hmr') {
      socket.write(
        `HTTP/1.1 404 Not Found\r\n` +
          'Connection: close\r\n' +
          'Content-Type: text/html\r\n' +
          `Content-Length: 9\r\n` +
          `\r\nNot Found`
      );
      socket.destroy();
    } else {
      this.defaultNextHandler(req, new ServerResponse(req)).catch(
        this.popError
      );
    }
  }

  handleHmrUpgradeCallback(): UpgradeHandler {
    return this.handleHmrUpgrade.bind(this);
  }

  private async handleRequestImpl(
    req: IncomingMessage,
    res: ServerResponse,
    { trailingPath }: RoutingInfo
  ) {
    if (!this.isPrepared) {
      res.writeHead(503);
      res.end(STATUS_CODES[503]);
      return;
    }

    const parsedUrl = parseUrl(req.url!, true);

    if (trailingPath.startsWith('_next')) {
      this.defaultNextHandler(req, res, parsedUrl);
      return;
    }

    try {
      const request = {
        method: req.method!,
        url: req.url!,
        route: trailingPath,
        headers: req.headers,
      };

      const response = await maybeInjectContainer(
        this.initScope(),
        this.requestHandler
      )(request);

      if (response.ok) {
        const { page, query, headers } = response;
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value as string);
          }
        }

        if (page || query) {
          await this.nextServer.render(
            req,
            res,
            page || trailingPath,
            query || parsedUrl.query,
            parsedUrl
          );
        } else {
          this.defaultNextHandler(req, res, parsedUrl);
        }
      } else {
        const { code, reason, headers } = response;
        res.statusCode = code;

        if (headers) {
          for (const [name, value] of Object.entries(headers)) {
            if (value) {
              res.setHeader(name, value);
            }
          }
        }

        await this.nextServer.renderError(
          reason ? new Error(reason) : null,
          req,
          res,
          trailingPath,
          parsedUrl.query
        );
      }
    } catch (err) {
      this.popError(err);

      res.statusCode = 500;
      await this.nextServer.renderError(
        err,
        req,
        res,
        trailingPath,
        parsedUrl.query
      );
    }
  }
}

export const ReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ServerI, ConfigsI, { require: ModuleUtilitiesI, optional: true }],
  factory: (nextApp, { noPrepare, handleRequest }, moduleUtils) =>
    new NextReceiver(nextApp, {
      noPrepare,
      handleRequest,
      initScope: moduleUtils?.initScope,
      popError: moduleUtils?.popError,
    }),
})(NextReceiver);

export type ReceiverP = NextReceiver;
