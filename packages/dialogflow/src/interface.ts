import { serviceInterface } from '@sociably/core/service';
import type { DialogflowConfigs } from './types.js';

/** @category Interface */
export const ConfigsI = serviceInterface<DialogflowConfigs<string, string>>({
  name: 'DialogflowConfigs',
});

export type ConfigsI = DialogflowConfigs<string, string>;
