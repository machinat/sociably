// @flow
import { parse as parseURL } from 'url';
import { STATUS_CODES as HTTP_STATUS_CODES } from 'http';
import {
  isAbsolute as isAbsolutePath,
  normalize as normalizePath,
  join as joinPath,
  relative as getRelativePath,
} from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';

import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';

import { HTTP_MODULE_CONFIGS_I, HTTPServer } from './interface';
import type {
  ServerListenOptions,
  RequestHandler,
  UpgradeHandler,
  HTTPModuleConfigs,
} from './types';

const isSubPath = (parent: string, child: string) => {
  const relativePath = getRelativePath(parent, child);
  return relativePath === '' || relativePath.slice(0, 2) !== '..';
};

const verifyRoutesConfiction = (
  existedRoutes: $ReadOnlyArray<{ path: string }>,
  path: string
) => {
  for (const { path: existedPath } of existedRoutes) {
    if (isSubPath(path, existedPath) || isSubPath(existedPath, path)) {
      throw new Error(
        `"${path}" is conficted with existed route "${existedPath}"`
      );
    }
  }
};

const endRes = (res: ServerResponse, code: number) => {
  res.statusCode = code;
  res.end(HTTP_STATUS_CODES[code]);
};

const respondUpgrade = (socket: Socket, code: number) => {
  const codeName = HTTP_STATUS_CODES[code];
  socket.write(
    `HTTP/1.1 ${code} ${codeName}\r\n` +
      'Connection: close\r\n' +
      'Content-Type: text/html\r\n' +
      `Content-Length: ${Buffer.byteLength(codeName)}\r\n` +
      `\r\n${codeName}`
  );
  socket.destroy();
};

class HTTPConnector {
  basePath: string;

  _requestRoutings: { path: string, handler: RequestHandler }[];
  _upgradeRoutings: { path: string, handler: UpgradeHandler }[];

  constructor(basePath?: string = '/') {
    if (!isAbsolutePath(basePath)) {
      throw Error('basePath path should be absolute');
    }

    this.basePath = normalizePath(basePath);
    this._requestRoutings = [];
    this._upgradeRoutings = [];
  }

  addRequestRoute(routePath: string, handler: RequestHandler) {
    const path = joinPath(this.basePath, routePath);
    verifyRoutesConfiction(this._requestRoutings, path);

    this._requestRoutings.push({ path, handler });
    return this;
  }

  addUpgradeRoute(routePath: string, handler: UpgradeHandler) {
    const path = joinPath(this.basePath, routePath);
    verifyRoutesConfiction(this._upgradeRoutings, path);

    this._upgradeRoutings.push({ path, handler });
    return this;
  }

  async connect(server: HTTPServer, options?: ServerListenOptions) {
    server.addListener('request', this._makeRequestHandler());
    if (this._upgradeRoutings.length > 0) {
      server.addListener('upgrade', this._makeUpgradeHandler());
    }

    await thenifiedly.callMethod('listen', server, options || {});
  }

  _makeRequestHandler(): RequestHandler {
    const requestRoutings = [...this._requestRoutings];

    if (requestRoutings.length === 0) {
      return (_, res) => {
        endRes(res, 403);
      };
    }

    if (requestRoutings.length === 1) {
      const [{ path, handler }] = requestRoutings;
      if (path === '/') {
        return handler;
      }
    }

    return (req: IncomingMessage, res: ServerResponse) => {
      const { pathname } = parseURL(req.url);
      if (!pathname) {
        endRes(res, 400);
        return;
      }

      for (const { path: routePath, handler } of requestRoutings) {
        if (isSubPath(routePath, pathname)) {
          handler(req, res);
          return;
        }
      }
      endRes(res, 404);
    };
  }

  _makeUpgradeHandler(): UpgradeHandler {
    const upgradeRoutings = [...this._upgradeRoutings];

    if (upgradeRoutings.length === 0) {
      return (_, socket) => {
        respondUpgrade(socket, 403);
      };
    }

    if (upgradeRoutings.length === 1) {
      const [{ path, handler }] = upgradeRoutings;
      if (path === '/') {
        return handler;
      }
    }

    return (req: IncomingMessage, socket: Socket, head: Buffer) => {
      const { pathname } = parseURL(req.url);
      if (!pathname) {
        respondUpgrade(socket, 403);
        return;
      }

      for (const { path: routePath, handler } of upgradeRoutings) {
        if (isSubPath(routePath, pathname)) {
          handler(req, socket, head);
          return;
        }
      }
      respondUpgrade(socket, 404);
    };
  }
}

export default provider<HTTPConnector>({
  lifetime: 'singleton',
  deps: [HTTP_MODULE_CONFIGS_I],
  factory: (configs: HTTPModuleConfigs) => new HTTPConnector(configs.basePath),
})(HTTPConnector);
