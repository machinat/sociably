import { makeInterface } from '@machinat/core/service';
import type {
  NextModuleConfigs,
  NextPlatformMounter,
  NextServer,
} from './types';

export const PLATFORM_MOUNTER_I = makeInterface<NextPlatformMounter>({
  name: 'NextPlatformMounter',
});

export const MODULE_CONFIGS_I = makeInterface<NextModuleConfigs>({
  name: 'NextModuleConfigs',
});

export const SERVER_I = makeInterface<NextServer>({
  name: 'NextServer',
});
