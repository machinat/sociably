import { makeInterface, abstractInterface } from '@machinat/core/service';
import type { FileRepositoryConfigs } from './types';

export const FILE_STATE_CONFIGS_I = makeInterface<FileRepositoryConfigs>({
  name: 'FileStateConfigs',
});

@abstractInterface<FileStateSerializerI>({
  name: 'FileStateSerializer',
})
export abstract class FileStateSerializerI {
  abstract parse(str: string): any;
  abstract stringify(obj: any): string;
}
