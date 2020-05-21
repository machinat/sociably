// @flow
/* eslint-disable class-methods-use-this, no-unused-vars */
import { namedInterface, abstractInterface } from '@machinat/core/service';
import type { FileRepositoryConfigs } from './types';

export const FILE_STATE_CONFIGS_I = namedInterface<FileRepositoryConfigs>({
  name: 'FileStateConfigs',
});

export const FileStateSerializerI = abstractInterface<{
  parse(string): Object,
  stringify(Object): string,
}>({
  name: 'FileStateSerializer',
})(
  class AbstractSerializer {
    parse(str: string): Object {
      throw new TypeError('method called on abstract class');
    }

    stringify(obj: Object): string {
      throw new TypeError('method called on abstract class');
    }
  }
);
