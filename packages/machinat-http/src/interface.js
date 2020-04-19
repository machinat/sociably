// @flow
import { namedInterface, abstractInterface } from '@machinat/core/service';
import type {
  ServerListenOptions,
  HTTPModuleConfigs,
  HTTPRequestRouting,
  HTTPUpgradeRouting,
} from './types';

class AbstractServer {
  +listen: (options: ServerListenOptions, cb: () => void) => void;
  +addListener: (name: string, cb: Function) => void;
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
