/* eslint-disable class-methods-use-this */
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { makeInterface, abstractInterface } from '@machinat/core/service';
import {
  ServerListenOptions,
  HTTPModuleConfigs,
  HTTPRequestRouting,
  HTTPUpgradeRouting,
} from './types';

@abstractInterface<HTTPServerI>()
export abstract class HTTPServerI {
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

export const HTTP_MODULE_CONFIGS_I = makeInterface<HTTPModuleConfigs>({
  name: 'HTTPModuleConfigs',
});

export const HTTP_REQUEST_ROUTINGS_I = makeInterface<HTTPRequestRouting[]>({
  name: 'HTTPRequestRoutingsList',
  multi: true,
});

export const HTTP_UPGRADE_ROUTINGS_I = makeInterface<HTTPUpgradeRouting[]>({
  name: 'HTTPUpgradeRoutingsList',
  multi: true,
});
