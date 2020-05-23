// @flow
import { makeInterface, abstractInterface } from '@machinat/core/service';
import type { NextModuleConfigs, NextPlatformMounter } from './types';

export const NEXT_PLATFORM_MOUNTER_I = makeInterface<NextPlatformMounter>({
  name: 'NextPlatformMounter',
});

export const NEXT_MODULE_CONFIGS_I = makeInterface<NextModuleConfigs>({
  name: 'NextModuleConfigs',
});

class AbstractNextServer {}

export const NextServerI = abstractInterface<any>()(AbstractNextServer);
