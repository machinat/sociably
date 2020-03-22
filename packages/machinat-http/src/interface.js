// @flow
import { namedInterface, abstractInterface } from '@machinat/core/service';
import type { ServerListenOptions, HTTPModuleConfigs } from './types';

class AbstractServer {
  /* eslint-disable no-unused-vars, class-methods-use-this */
  listen(options: ServerListenOptions, cb: () => void): void {
    throw new Error('method being called on abstract class');
  }

  addListener(name: string, cb: Function): void {
    throw new Error('method being called on abstract class');
  }
  /* eslint-enable no-unused-vars, class-methods-use-this */
}

export const HTTPServerI = abstractInterface<AbstractServer>()(AbstractServer);

export const HTTP_MODULE_CONFIGS_I = namedInterface<HTTPModuleConfigs>(
  'HTTPModuleConfigs'
);
