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

/** @category Provider */
export class HttpConnector {
  basePath: string;
  entryUrl: string;
  private requestRoutes: RequestRoute[];
  private defaultRequestRoute: null | DefaultRequestRoute;
  private upgradeRoutes: UpgradeRoute[];
  private defaultUpgradeRoute: null | DefaultUpgradeRoute;

  constructor({ entryUrl, requestRoutes, upgradeRoutes }: ConnectorOptions) {
    this.requestRoutes = [];
    this.upgradeRoutes = [];
    this.defaultRequestRoute = null;
    this.defaultUpgradeRoute = null;

    this.entryUrl = entryUrl;
    this.basePath = new URL(entryUrl).pathname;
    if (!this.basePath.endsWith('/')) {
      throw new Error('entryUrl must be a directory which ends with "/"');
    }

    if (requestRoutes) {
      for (const route of requestRoutes) {
        if (route.default) {
          if (this.defaultRequestRoute) {
            throw new Error(
              `multiple default request routes received: ${
                this.defaultRequestRoute.name || 'unknown'
              }, ${route.name || 'unknown'}`,
            );
          }

          this.defaultRequestRoute = route;
        } else {
          const err = checkRoutePath(this.requestRoutes, route);
          if (err) {
            throw err;
          }
          this.requestRoutes.push(route);
        }
      }
    }

    if (upgradeRoutes) {
      for (const route of upgradeRoutes) {
        if (route.default) {
          if (this.defaultUpgradeRoute) {
            throw new Error(
              `multiple default upgrade routes received: "${this.defaultUpgradeRoute.name}", "${route.name}"`,
            );
          }

          this.defaultUpgradeRoute = route;
        } else {
          const err = checkRoutePath(this.upgradeRoutes, route);
          if (err) {
            throw err;
          }
          this.upgradeRoutes.push(route);
        }
      }
    }
  }

  async connect(server: ServerI, options?: ServerListenOptions): Promise<void> {
    server.addListener('request', this._handleRequestCallback);
    if (this.upgradeRoutes.length > 0) {
      server.addListener('upgrade', this._handleUpgradeCallback);
    }

    await thenifiedly.callMethod('listen', server, options || {});
  }

  private _handleRequestCallback = this.handleRequest.bind(this);

  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const { pathname } = parseUrl(req.url!);
    if (!pathname) {
      endRes(res, 400);
      return;
    }

    for (const { path: routePath, handler } of this.requestRoutes) {
      const matchedRoutingInfo = this._getMatchedRoutingInfo(
        pathname,
        routePath,
      );
      if (matchedRoutingInfo) {
        handler(req, res, matchedRoutingInfo);
        return;
      }
    }

    if (!this.defaultRequestRoute) {
      endRes(res, 404);
      return;
    }

    this.defaultRequestRoute.handler(req, res, {
      originalPath: pathname,
      basePath: this.basePath,
      matchedPath: undefined,
      trailingPath: pathname.slice(1),
    });
  }

  private _handleUpgradeCallback = this.handleUpgrade.bind(this);

  handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer): void {
    const { pathname } = parseUrl(req.url!);
    if (!pathname) {
      respondUpgrade(socket, 403);
      return;
    }

    for (const { path: routePath, handler } of this.upgradeRoutes) {
      const matchedRoutingInfo = this._getMatchedRoutingInfo(
        pathname,
        routePath,
      );
      if (matchedRoutingInfo) {
        handler(req, socket, head, matchedRoutingInfo);
        return;
      }
    }

    if (!this.defaultUpgradeRoute) {
      respondUpgrade(socket, 404);
      return;
    }

    this.defaultUpgradeRoute.handler(req, socket, head, {
      originalPath: pathname,
      basePath: this.basePath,
      matchedPath: undefined,
      trailingPath: pathname.slice(1),
    });
  }

  getServerUrl(subpath?: string): string {
    return new URL(subpath || '', this.entryUrl).href;
  }

  private _getMatchedRoutingInfo(
    pathname: string,
    routePath: string,
  ): null | RoutingInfo {
    const trailingPath = getTrailingPath(
      resolvePath(this.basePath, routePath),
      pathname,
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
