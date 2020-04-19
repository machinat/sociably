// @flow
import { parse as parseURL } from 'url';
import { STATUS_CODES as HTTP_STATUS_CODES } from 'http';
import { relative as getRelativePath } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';
import {
  HTTPServerI,
  HTTP_MODULE_CONFIGS_I,
  HTTP_REQUEST_ROUTINGS_I,
  HTTP_UPGRADE_ROUTINGS_I,
} from './interface';
import type {
  ServerListenOptions,
  RequestHandler,
  UpgradeHandler,
  HTTPModuleConfigs,
  HTTPRequestRouting,
  HTTPUpgradeRouting,
} from './types';

const isSubPath = (parent: string, child: string) => {
  const relativePath = getRelativePath(parent, child);
  return relativePath === '' || relativePath.slice(0, 2) !== '..';
};

const verifyRoutesConfliction = (
  existedRoutings: $ReadOnlyArray<{ name?: string, path: string }>,
  routing: { name?: string, path: string }
) => {
  for (const { name, path } of existedRoutings) {
    if (isSubPath(path, routing.path) || isSubPath(routing.path, path)) {
      throw new Error(
        `${routing.name || 'unknown'} routing "${
          routing.path
        }" is conflicted with ${name || 'unknown'} routing "${path}"`
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
  _requestRoutings: HTTPRequestRouting[];
  _upgradeRoutings: HTTPUpgradeRouting[];

  constructor() {
    this._requestRoutings = [];
    this._upgradeRoutings = [];
  }

  addRequestRouting(...routings: HTTPRequestRouting[]) {
    for (const routing of routings) {
      verifyRoutesConfliction(this._requestRoutings, routing);

      this._requestRoutings.push(routing);
    }

    return this;
  }

  addUpgradeRouting(...routings: HTTPUpgradeRouting[]) {
    for (const routing of routings) {
      verifyRoutesConfliction(this._upgradeRoutings, routing);

      this._upgradeRoutings.push(routing);
    }

    return this;
  }

  async connect(server: HTTPServerI, options?: ServerListenOptions) {
    server.addListener('request', this._makeRequestCallback());
    if (this._upgradeRoutings.length > 0) {
      server.addListener('upgrade', this._makeUpgradeCallback());
    }

    await thenifiedly.callMethod('listen', server, options || {});
  }

  _makeRequestCallback(): RequestHandler {
    const requestRoutings = this._requestRoutings;
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

  _makeUpgradeCallback(): UpgradeHandler {
    const upgradeRoutings = this._upgradeRoutings;
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
  deps: [
    HTTP_MODULE_CONFIGS_I,
    HTTP_REQUEST_ROUTINGS_I,
    HTTP_UPGRADE_ROUTINGS_I,
  ],
  factory: (
    configs: HTTPModuleConfigs,
    requestRoutings: HTTPRequestRouting[],
    upgradeRoutings: HTTPUpgradeRouting[]
  ) => {
    const connector = new HTTPConnector();

    connector.addRequestRouting(...requestRoutings);
    connector.addUpgradeRouting(...upgradeRoutings);

    return connector;
  },
})(HTTPConnector);
