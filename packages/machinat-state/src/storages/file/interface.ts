import { makeInterface, abstractInterface } from '@machinat/core/service';
import type { FileRepositoryConfigs } from './types';

/**
 * @category Interface
 */
export const MODULE_CONFIGS_I = makeInterface<FileRepositoryConfigs>({
  name: 'FileStateConfigsI',
});

export abstract class FileStateSerializer {
  abstract parse(str: string): any;
  abstract stringify(obj: any): string;
}

/**
 * @category Interface
 */
export const SerializerI = abstractInterface<FileStateSerializer>({
  name: 'FileStateSerializerI',
})(FileStateSerializer);

export type SerializerI = FileStateSerializer;
