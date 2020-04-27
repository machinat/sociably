// @flow
/* eslint-disable class-methods-use-this */
import { namedInterface, abstractInterface } from '@machinat/core/service';
import type {
  ServerListenOptions,
  HTTPModuleConfigs,
  HTTPRequestRouting,
  HTTPUpgradeRouting,
} from './types';

class AbstractServer {
  listen(_options: ServerListenOptions, _cb: () => void): void {
    throw new TypeError('method called on abstract class');
  }

  addListener(_name: string, _cb: Function): void {
    throw new TypeError('method called on abstract class');
  }
}

export const HTTPServerI = abstractInterface<AbstractServer>()(AbstractServer);

export const HTTP_MODULE_CONFIGS_I = namedInterface<HTTPModuleConfigs>({
  name: 'HTTPModuleConfigs',
});

export const HTTP_REQUEST_ROUTINGS_I = namedInterface<HTTPRequestRouting[]>({
  name: 'HTTPRequestRoutingsList',
  multi: true,
});

export const HTTP_UPGRADE_ROUTINGS_I = namedInterface<HTTPUpgradeRouting[]>({
  name: 'HTTPUpgradeRoutingsList',
  multi: true,
});
