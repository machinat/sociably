import { makeInterface } from '@machinat/core/service';
import type { DialogflowConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<DialogflowConfigs>({
  name: 'DialogflowConfigs',
});

export type ConfigsI = DialogflowConfigs;
