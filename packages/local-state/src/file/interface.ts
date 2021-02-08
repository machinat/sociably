import { makeInterface } from '@machinat/core/service';
import type { FileRepositoryConfigs, FileStateSerializer } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<FileRepositoryConfigs>({
  name: 'FileStateConfigs',
});

export type ConfigsI = FileRepositoryConfigs;

/**
 * @category Interface
 */
export const SerializerI = makeInterface<FileStateSerializer>({
  name: 'FileStateSerializer',
});

export type SerializerI = FileStateSerializer;
