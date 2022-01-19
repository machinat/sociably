import { makeInterface } from '@machinat/core/service';
import type { FileStateConfigs, FileStateSerializer } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<FileStateConfigs>({
  name: 'FileStateConfigs',
});

export type ConfigsI = FileStateConfigs;

/**
 * @category Interface
 */
export const SerializerI = makeInterface<FileStateSerializer>({
  name: 'FileStateSerializer',
});

export type SerializerI = FileStateSerializer;
