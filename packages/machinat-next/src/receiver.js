// @flow
import { parse as parseURL } from 'url';
import { STATUS_CODES } from 'http';
import { provider } from '@machinat/core/service';
import type { IncomingMessage, ServerResponse } from 'http';
import type { PopEventWrapper, PopErrorFn } from '@machinat/core/types';
import {
  NextServerI,
  NEXT_MODULE_CONFIGS_I,
  NEXT_PLATFORM_MOUNTER_I,
} from './interface';
import type {
  NextEventContext,
  NextResponse,
  NextModuleConfigs,
  NextPlatformMounter,
} from './types';

const NEXT_SERVER_CHANNEL = {
  platform: 'next',
  type: 'server',
  uid: 'next.server',
};

type NextReceiverOptions = {
  entryPath?: string,
  shouldPrepare?: boolean,
};

type ParsedURL = $Call<typeof parseURL, string>;

class NextReceiver {
  _next: Object;
  _defaultNextHandler: (IncomingMessage, ServerResponse, ParsedURL) => void;

  _pathPrefix: string;
  _shouldPrepare: boolean;
  _prepared: boolean;

  _popEvent: NextEventContext => Promise<NextResponse>;
  _popError: Error => void;

  constructor(
    nextApp: Object,
    { shouldPrepare = true, entryPath }: NextReceiverOptions,
    popEventWrapper: ?PopEventWrapper<NextEventContext, NextResponse>,
    popError: ?PopErrorFn
  ) {
    this._next = nextApp;
    this._defaultNextHandler = nextApp.getRequestHandler();
    this._pathPrefix = entryPath ? entryPath.replace(/\/$/, '') : '';
    this._shouldPrepare = shouldPrepare;
    this._prepared = false;

    const finalHandler = () => Promise.resolve({ accepted: true });

    this._popEvent = popEventWrapper
      ? popEventWrapper(finalHandler)
      : finalHandler;
    this._popError = popError || (() => {});
  }

  async prepare() {
    if (this._shouldPrepare) {
      await this._next.prepare();
    }
    this._prepared = true;
  }

  handleRequest(req: IncomingMessage, res: ServerResponse) {
    this._handleRequestImpl(req, res).catch(this._popError);
  }

  handleRequestCallback() {
    return this.handleRequest.bind(this);
  }

  async _handleRequestImpl(req: IncomingMessage, res: ServerResponse) {
    if (!this._prepared) {
      res.statusCode = 503; // eslint-disable-line no-param-reassign
      res.end(STATUS_CODES[503]);
      return;
    }

    const parsedURL = parseURL(req.url, true);
    const pathPrefix = this._pathPrefix;

    const { pathname } = parsedURL;
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
        parsedURL.pathname,
        parsedURL.query
      );
      return;
    }

    const parsedURLWithPathPrefixTrimed = {
      ...parsedURL,
      pathname: trimedPath,
      path: (parsedURL.path: any).slice(pathPrefix.length) || '/',
    };

    if (trimedPath.slice(1, 6) === '_next') {
      if (this._next.renderOpts.dev && pathPrefix !== '') {
        // HACK: to make react hot loader server recognize the request in
        //       dev environment
        // eslint-disable-next-line no-param-reassign
        req.url = trimedPath;
      }

      this._defaultNextHandler(req, res, parsedURLWithPathPrefixTrimed);
      return;
    }

    try {
      const request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
      };

      const response = await this._popEvent({
        platform: 'next',
        channel: NEXT_SERVER_CHANNEL,
        event: { platform: 'next', type: 'request', payload: { request } },
        metadata: { source: 'next', request },
        bot: null,
        user: null,
      });

      if (response.accepted) {
        const { page, query, headers } = response;
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, (value: any));
          }
        }

        if (page || query) {
          await this._next.render(
            req,
            res,
            page || trimedPath,
            query || parsedURL.query,
            parsedURLWithPathPrefixTrimed
          );
        } else {
          this._defaultNextHandler(req, res, parsedURLWithPathPrefixTrimed);
        }
      } else {
        const { code, reason, headers } = response;
        res.writeHead(code, headers);
        await this._next.renderError(
          new Error(reason),
          req,
          res,
          trimedPath,
          parsedURL.query
        );
      }
    } catch (err) {
      this._popError(err);

      res.statusCode = 500;
      await this._next.renderError(err, req, res, trimedPath, parsedURL.query);
    }
  }
}

export default provider<NextReceiver>({
  lifetime: 'singleton',
  deps: [
    NextServerI,
    NEXT_MODULE_CONFIGS_I,
    { require: NEXT_PLATFORM_MOUNTER_I, optional: true },
  ],
  factory: (
    nextApp: Object,
    configs: NextModuleConfigs,
    mounter: null | NextPlatformMounter
  ) =>
    new NextReceiver(
      nextApp,
      configs,
      mounter?.popEventWrapper,
      mounter?.popError
    ),
})(NextReceiver);
