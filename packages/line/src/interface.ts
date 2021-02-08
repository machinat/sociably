import { makeInterface } from '@machinat/core/service';
import type { LineConfigs, LinePlatformMounter } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<LineConfigs>({
  name: 'LineConfigs',
});

export type ConfigsI = LineConfigs;

/**
 * @category Interface
 */
export const PlatformMounterI = makeInterface<LinePlatformMounter>({
  name: 'LinePlatformMounter',
});
