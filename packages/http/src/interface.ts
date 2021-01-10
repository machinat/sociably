import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { makeInterface } from '@machinat/core/service';
import type {
  ServerListenOptions,
  HttpModuleConfigs,
  HttpRequestRouting,
  HttpUpgradeRouting,
} from './types';

/**
 * @category Interface
 */
export interface HttpServer {
  listen(options: ServerListenOptions, cb: () => void): void;

  addListener(
    name: 'request',
    cb: (req: IncomingMessage, res: ServerResponse) => void
  ): void;

  addListener(
    name: 'upgrade',
    cb: (req: IncomingMessage, socket: Socket, head: Buffer) => void
  ): void;
}

export const HttpServerI = makeInterface<HttpServer>({
  name: 'HTTPServerI',
});

export type HttpServerI = HttpServer;

/**
 * @category Interface
 */
export const MODULE_CONFIGS_I = makeInterface<HttpModuleConfigs>({
  name: 'HTTPModuleConfigsI',
});

/**
 * @category Interface
 */
export const REQUEST_ROUTINGS_I = makeInterface<HttpRequestRouting>({
  name: 'HTTPRequestRoutingsListI',
  multi: true,
});

/**
 * @category Interface
 */
export const UPGRADE_ROUTINGS_I = makeInterface<HttpUpgradeRouting>({
  name: 'HTTPUpgradeRoutingsListI',
  multi: true,
});
