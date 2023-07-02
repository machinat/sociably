import { parse as parseUrl } from 'url';
import { resolve as resolvePath } from 'path/posix';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import thenifiedly from 'thenifiedly';
import { serviceProviderClass } from '@sociably/core/service';
import { RoutingInfo } from '@sociably/http';
import {
  ServerI,
  ConfigsI,
  RequestRouteListI,
  UpgradeRouteListI,
} from './interface.js';
import {
  endRes,
  respondUpgrade,
  getTrailingPath,
  checkRoutePath,
} from './utils.js';
import type {
  ServerListenOptions,
  RequestRoute,
  DefaultRequestRoute,
  UpgradeRoute,
  DefaultUpgradeRoute,
} from './types.js';

type ConnectorOptions = {
  entryUrl: string;
  requestRoutes?: (RequestRoute | DefaultRequestRoute)[];
  upgradeRoutes?: (UpgradeRoute | DefaultUpgradeRoute)[];
};

/**
 * @category Provider
 */
export class HttpConnector {
  basePath: string;
  private _requestRoutes: RequestRoute[];
  private _defaultRequestRoute: null | DefaultRequestRoute;
  private _upgradeRoutes: UpgradeRoute[];
  private _defaultUpgradeRoute: null | DefaultUpgradeRoute;

  constructor({ entryUrl, requestRoutes, upgradeRoutes }: ConnectorOptions) {
    this._requestRoutes = [];
    this._upgradeRoutes = [];
    this._defaultRequestRoute = null;
    this._defaultUpgradeRoute = null;

    const { pathname: basePath } = new URL(entryUrl);
    if (!basePath.endsWith('/')) {
      throw new Error('entryUrl must be a directory which ends with "/"');
    }
    this.basePath = basePath;

    if (requestRoutes) {
      for (const route of requestRoutes) {
        if (route.default) {
          if (this._defaultRequestRoute) {
            throw new Error(
              `multiple default request routes received: ${
                this._defaultRequestRoute.name || 'unknown'
              }, ${route.name || 'unknown'}`
            );
          }

          this._defaultRequestRoute = route;
        } else {
          const err = checkRoutePath(this._requestRoutes, route);
          if (err) {
            throw err;
          }
          this._requestRoutes.push(route);
        }
      }
    }

    if (upgradeRoutes) {
      for (const route of upgradeRoutes) {
        if (route.default) {
          if (this._defaultUpgradeRoute) {
            throw new Error(
              `multiple default upgrade routes received: "${this._defaultUpgradeRoute.name}", "${route.name}"`
            );
          }

          this._defaultUpgradeRoute = route;
        } else {
          const err = checkRoutePath(this._upgradeRoutes, route);
          if (err) {
            throw err;
          }
          this._upgradeRoutes.push(route);
        }
      }
    }
  }

  async connect(server: ServerI, options?: ServerListenOptions): Promise<void> {
    server.addListener('request', this._handleRequestCallback);
    if (this._upgradeRoutes.length > 0) {
      server.addListener('upgrade', this._handleUpgradeCallback);
    }

    await thenifiedly.callMethod('listen', server, options || {});
  }

  private _handleRequestCallback = this.handleRequest.bind(this);

  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const { pathname } = parseUrl(req.url as string);
    if (!pathname) {
      endRes(res, 400);
      return;
    }

    for (const { path: routePath, handler } of this._requestRoutes) {
      const matchedRoutingInfo = this._getMatchedRoutingInfo(
        pathname,
        routePath
      );
      if (matchedRoutingInfo) {
        handler(req, res, matchedRoutingInfo);
        return;
      }
    }

    if (!this._defaultRequestRoute) {
      endRes(res, 404);
      return;
    }

    this._defaultRequestRoute.handler(req, res, {
      originalPath: pathname,
      basePath: this.basePath,
      matchedPath: undefined,
      trailingPath: pathname.slice(1),
    });
  }

  private _handleUpgradeCallback = this.handleUpgrade.bind(this);

  handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer): void {
    const { pathname } = parseUrl(req.url as string);
    if (!pathname) {
      respondUpgrade(socket, 403);
      return;
    }

    for (const { path: routePath, handler } of this._upgradeRoutes) {
      const matchedRoutingInfo = this._getMatchedRoutingInfo(
        pathname,
        routePath
      );
      if (matchedRoutingInfo) {
        handler(req, socket, head, matchedRoutingInfo);
        return;
      }
    }

    if (!this._defaultUpgradeRoute) {
      respondUpgrade(socket, 404);
      return;
    }

    this._defaultUpgradeRoute.handler(req, socket, head, {
      originalPath: pathname,
      basePath: this.basePath,
      matchedPath: undefined,
      trailingPath: pathname.slice(1),
    });
  }

  private _getMatchedRoutingInfo(
    pathname: string,
    routePath: string
  ): null | RoutingInfo {
    const trailingPath = getTrailingPath(
      resolvePath(this.basePath, routePath),
      pathname
    );
    return trailingPath === undefined
      ? null
      : {
          originalPath: pathname,
          basePath: this.basePath,
          matchedPath: routePath,
          trailingPath,
        };
  }
}

const ConnectorP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConfigsI, RequestRouteListI, UpgradeRouteListI],
  factory: ({ entryUrl }, requestRoutes, upgradeRoutes) =>
    new HttpConnector({ entryUrl, requestRoutes, upgradeRoutes }),
})(HttpConnector);

type ConnectorP = HttpConnector;

export default ConnectorP;
