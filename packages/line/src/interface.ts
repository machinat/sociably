import { makeInterface } from '@sociably/core/service';
import type { LineConfigs, LinePlatformUtilities } from './types';

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
export const PlatformUtilitiesI = makeInterface<LinePlatformUtilities>({
  name: 'LinePlatformUtilities',
});
