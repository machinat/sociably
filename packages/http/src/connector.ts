import { parse as parseUrl } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import thenifiedly from 'thenifiedly';
import { makeClassProvider } from '@machinat/core/service';
import { ServerI, RequestRouteListI, UpgradeRouteListI } from './interface';
import {
  endRes,
  respondUpgrade,
  getTrailingPath,
  checkRoutesConfliction,
  formatRoute,
} from './utils';
import type {
  ServerListenOptions,
  RequestRoute,
  DefaultRequestRoute,
  UpgradeRoute,
  DefaultUpgradeRoute,
} from './types';

type ConnectorOptions = {
  requestRoutes?: (RequestRoute | DefaultRequestRoute)[];
  upgradeRoutes?: (UpgradeRoute | DefaultUpgradeRoute)[];
};

/**
 * @category Provider
 */
export class HttpConnector {
  private _requestRoutes: RequestRoute[];
  private _defaultRequestRoute: null | DefaultRequestRoute;
  private _upgradeRoutes: UpgradeRoute[];
  private _defaultUpgradeRoute: null | DefaultUpgradeRoute;

  constructor({ requestRoutes, upgradeRoutes }: ConnectorOptions) {
    this._requestRoutes = [];
    this._upgradeRoutes = [];
    this._defaultRequestRoute = null;
    this._defaultUpgradeRoute = null;

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
          const [ok, conflictedRoute] = checkRoutesConfliction(
            this._requestRoutes,
            route
          );

          if (!ok) {
            throw new Error(
              `request route ${formatRoute(
                route
              )} is conflicted with route ${formatRoute(conflictedRoute)}`
            );
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
          const [ok, conflictedRoute] = checkRoutesConfliction(
            this._upgradeRoutes,
            route
          );

          if (!ok) {
            throw new Error(
              `upgrade route ${formatRoute(
                route
              )} is conflicted with route ${formatRoute(conflictedRoute)}`
            );
          }

          this._upgradeRoutes.push(route);
        }
      }
    }
  }

  async connect(server: ServerI, options?: ServerListenOptions): Promise<void> {
    server.addListener('request', this.makeRequestCallback());
    if (this._upgradeRoutes.length > 0) {
      server.addListener('upgrade', this.makeUpgradeCallback());
    }

    await thenifiedly.callMethod('listen', server, options || {});
  }

  makeRequestCallback(): (req: IncomingMessage, res: ServerResponse) => void {
    const requestRoutes = [...this._requestRoutes];

    return (req: IncomingMessage, res: ServerResponse) => {
      const { pathname } = parseUrl(req.url as string);
      if (!pathname) {
        endRes(res, 400);
        return;
      }

      for (const { path: routePath, handler } of requestRoutes) {
        const trailingPath = getTrailingPath(routePath, pathname);

        if (trailingPath !== undefined) {
          handler(req, res, {
            originalPath: pathname,
            matchedPath: routePath,
            trailingPath,
          });
          return;
        }
      }

      if (!this._defaultRequestRoute) {
        endRes(res, 404);
        return;
      }

      this._defaultRequestRoute.handler(req, res, {
        originalPath: pathname,
        matchedPath: undefined,
        trailingPath: undefined,
      });
    };
  }

  makeUpgradeCallback(): (
    req: IncomingMessage,
    socket: Socket,
    head: Buffer
  ) => void {
    const upgradeRoutes = [...this._upgradeRoutes];

    return (req: IncomingMessage, socket: Socket, head: Buffer) => {
      const { pathname } = parseUrl(req.url as string);
      if (!pathname) {
        respondUpgrade(socket, 403);
        return;
      }

      for (const { path: routePath, handler } of upgradeRoutes) {
        const trailingPath = getTrailingPath(routePath, pathname);
        if (trailingPath !== undefined) {
          handler(req, socket, head, {
            originalPath: pathname,
            matchedPath: routePath,
            trailingPath,
          });
          return;
        }
      }

      if (!this._defaultUpgradeRoute) {
        respondUpgrade(socket, 404);
        return;
      }

      this._defaultUpgradeRoute.handler(req, socket, head, {
        originalPath: pathname,
        matchedPath: undefined,
        trailingPath: undefined,
      });
    };
  }
}

export const ConnectorP = makeClassProvider({
  lifetime: 'singleton',
  deps: [RequestRouteListI, UpgradeRouteListI] as const,
  factory: (requestRoutes, upgradeRoutes) =>
    new HttpConnector({ requestRoutes, upgradeRoutes }),
})(HttpConnector);

export type ConnectorP = HttpConnector;
