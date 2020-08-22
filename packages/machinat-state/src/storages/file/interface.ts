import { makeInterface, abstractInterface } from '@machinat/core/service';
import type { FileRepositoryConfigs } from './types';

export const FILE_STATE_CONFIGS_I = makeInterface<FileRepositoryConfigs>({
  name: 'FileStateConfigsI',
});

export abstract class FileStateSerializer {
  abstract parse(str: string): any;
  abstract stringify(obj: any): string;
}

export const FileStateSerializerI = abstractInterface<FileStateSerializer>({
  name: 'FileStateSerializer',
})(FileStateSerializer);
