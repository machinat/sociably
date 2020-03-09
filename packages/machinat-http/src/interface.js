// @flow
import { namedInterface, abstractInterface } from '@machinat/core/service';
import type { ServerListenOptions, HTTPModuleConfigs } from './types';

class AbstractServer {
  /* eslint-disable no-unused-vars, class-methods-use-this */
  listen(options: ServerListenOptions, cb: () => void): void {
    throw new Error('method on abstract class being called');
  }

  addListener(name: string, cb: Function): void {
    throw new Error('method on abstract class being called');
  }
  /* eslint-enable no-unused-vars, class-methods-use-this */
}

export const HTTPServer = abstractInterface<AbstractServer>()(AbstractServer);

export const HTTP_MODULE_CONFIGS_I = namedInterface<HTTPModuleConfigs>(
  'HTTPModuleConfigs'
);
