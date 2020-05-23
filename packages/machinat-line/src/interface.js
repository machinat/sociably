// @flow
import { makeInterface } from '@machinat/core/service';
import type { LinePlatformConfigs, LinePlatformMounter } from './types';

export const LINE_PLATFORM_CONFIGS_I = makeInterface<LinePlatformConfigs>({
  name: 'LinePlatformConfigs',
});

export const LINE_PLATFORM_MOUNTER_I = makeInterface<LinePlatformMounter>({
  name: 'LinePlatformMounter',
});
