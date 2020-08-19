import { parse as parseURL } from 'url';
import { STATUS_CODES } from 'http';
import type { IncomingMessage, ServerResponse } from 'http';
import { relative as getRelativePath } from 'path';
import { Socket } from 'net';
import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';
import {
  HTTPServer,
  MODULE_CONFIGS_I,
  REQUEST_ROUTINGS_I,
  UPGRADE_ROUTINGS_I,
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
  existedRoutings: ReadonlyArray<{ name?: string; path: string }>,
  routing: { name?: string; path: string }
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
  res.end(STATUS_CODES[code]);
};

const respondUpgrade = (socket: Socket, code: number) => {
  const codeName = STATUS_CODES[code] as string;
  socket.write(
    `HTTP/1.1 ${code} ${codeName}\r\n` +
      'Connection: close\r\n' +
      'Content-Type: text/html\r\n' +
      `Content-Length: ${Buffer.byteLength(codeName)}\r\n` +
      `\r\n${codeName}`
  );
  socket.destroy();
};

export class HTTPConnector {
  private _requestRoutings: HTTPRequestRouting[];
  private _upgradeRoutings: HTTPUpgradeRouting[];

  constructor(
    configs: HTTPModuleConfigs,
    requestRoutings?: null | HTTPRequestRouting[],
    upgradeRoutings?: null | HTTPUpgradeRouting[]
  ) {
    this._requestRoutings = requestRoutings ? [...requestRoutings] : [];
    this._upgradeRoutings = upgradeRoutings ? [...upgradeRoutings] : [];
  }

  addRequestRouting(...routings: HTTPRequestRouting[]): this {
    for (const routing of routings) {
      verifyRoutesConfliction(this._requestRoutings, routing);

      this._requestRoutings.push(routing);
    }

    return this;
  }

  addUpgradeRouting(...routings: HTTPUpgradeRouting[]): this {
    for (const routing of routings) {
      verifyRoutesConfliction(this._upgradeRoutings, routing);

      this._upgradeRoutings.push(routing);
    }

    return this;
  }

  async connect(
    server: HTTPServer,
    options?: ServerListenOptions
  ): Promise<void> {
    server.addListener('request', this.makeRequestCallback());
    if (this._upgradeRoutings.length > 0) {
      server.addListener('upgrade', this.makeUpgradeCallback());
    }

    await thenifiedly.callMethod('listen', server, options || {});
  }

  makeRequestCallback(): RequestHandler {
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
      const { pathname } = parseURL(req.url as string);
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

  makeUpgradeCallback(): UpgradeHandler {
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
      const { pathname } = parseURL(req.url as string);
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
  deps: [MODULE_CONFIGS_I, REQUEST_ROUTINGS_I, UPGRADE_ROUTINGS_I],
})(HTTPConnector);
