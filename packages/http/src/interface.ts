import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { makeInterface } from '@machinat/core/service';
import type {
  ServerListenOptions,
  HTTPModuleConfigs,
  HTTPRequestRouting,
  HTTPUpgradeRouting,
} from './types';

/**
 * @category Interface
 */
export interface HTTPServer {
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

export const HTTPServerI = makeInterface<HTTPServer>({
  name: 'HTTPServerI',
});

export type HTTPServerI = HTTPServer;

/**
 * @category Interface
 */
export const MODULE_CONFIGS_I = makeInterface<HTTPModuleConfigs>({
  name: 'HTTPModuleConfigsI',
});

/**
 * @category Interface
 */
export const REQUEST_ROUTINGS_I = makeInterface<HTTPRequestRouting>({
  name: 'HTTPRequestRoutingsListI',
  multi: true,
});

/**
 * @category Interface
 */
export const UPGRADE_ROUTINGS_I = makeInterface<HTTPUpgradeRouting>({
  name: 'HTTPUpgradeRoutingsListI',
  multi: true,
});
