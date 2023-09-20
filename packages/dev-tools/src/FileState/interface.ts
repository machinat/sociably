import { serviceInterface } from '@sociably/core/service';
import type { FileStateConfigs, FileStateSerializer } from './types.js';

/** @category Interface */
export const ConfigsI = serviceInterface<FileStateConfigs>({
  name: 'FileStateConfigs',
});

export type ConfigsI = FileStateConfigs;

/** @category Interface */
export const SerializerI = serviceInterface<FileStateSerializer>({
  name: 'FileStateSerializer',
});

export type SerializerI = FileStateSerializer;
