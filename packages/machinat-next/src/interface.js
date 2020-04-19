// @flow
import { namedInterface, abstractInterface } from '@machinat/core/service';
import type { NextModuleConfigs, NextPlatformMounter } from './types';

export const NEXT_PLATFORM_MOUNTER_I = namedInterface<NextPlatformMounter>({
  name: 'NextPlatformMounter',
});

export const NEXT_MODULE_CONFIGS_I = namedInterface<NextModuleConfigs>({
  name: 'NextModuleConfigs',
});

class AbstractNextServer {}

export const NextServerI = abstractInterface<any>()(AbstractNextServer);
