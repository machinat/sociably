import { makeInterface } from '@machinat/core/service';
import type { FileRepositoryConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<FileRepositoryConfigs>({
  name: 'FileStateConfigsI',
});

export type ConfigsI = FileRepositoryConfigs;

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
