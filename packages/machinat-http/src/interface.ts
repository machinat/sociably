/* eslint-disable class-methods-use-this */
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { makeInterface, abstractInterface } from '@machinat/core/service';
import type {
  ServerListenOptions,
  HTTPModuleConfigs,
  HTTPRequestRouting,
  HTTPUpgradeRouting,
} from './types';

export abstract class HTTPServer {
  abstract listen(options: ServerListenOptions, cb: () => void): void;

  abstract addListener(
    name: 'request',
    cb: (req: IncomingMessage, res: ServerResponse) => void
  ): void;

  abstract addListener(
    name: 'upgrade',
    cb: (req: IncomingMessage, socket: Socket, head: Buffer) => void
  ): void;
}
export const ServerI = abstractInterface<HTTPServer>({
  name: 'HTTPServerI',
})(HTTPServer);

export const MODULE_CONFIGS_I = makeInterface<HTTPModuleConfigs>({
  name: 'HTTPModuleConfigsI',
});

export const REQUEST_ROUTINGS_I = makeInterface<HTTPRequestRouting[]>({
  name: 'HTTPRequestRoutingsListI',
  multi: true,
});

export const UPGRADE_ROUTINGS_I = makeInterface<HTTPUpgradeRouting[]>({
  name: 'HTTPUpgradeRoutingsListI',
  multi: true,
});
