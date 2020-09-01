import { makeInterface } from '@machinat/core/service';
import type {
  NextModuleConfigs,
  NextPlatformMounter,
  NextServer,
} from './types';

/**
 * @category Interface
 */
export const PLATFORM_MOUNTER_I = makeInterface<NextPlatformMounter>({
  name: 'NextPlatformMounterI',
});

/**
 * @category Interface
 */
export const MODULE_CONFIGS_I = makeInterface<NextModuleConfigs>({
  name: 'NextModuleConfigsI',
});

/**
 * @category Interface
 */
export const SERVER_I = makeInterface<NextServer>({
  name: 'NextServerI',
});
