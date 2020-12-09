import { makeInterface } from '@machinat/core/service';
import type { FileRepositoryConfigs } from './types';

/**
 * @category Interface
 */
export const MODULE_CONFIGS_I = makeInterface<FileRepositoryConfigs>({
  name: 'FileStateConfigsI',
});

export interface FileStateSerializer {
  parse(str: string): any;
  stringify(obj: any): string;
}

/**
 * @category Interface
 */
export const SerializerI = makeInterface<FileStateSerializer>({
  name: 'FileStateSerializerI',
});

export type SerializerI = FileStateSerializer;
