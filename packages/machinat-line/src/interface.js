// @flow
import { namedInterface } from '@machinat/core/service';
import type { LinePlatformConfigs, LinePlatformMounter } from './types';

export const LINE_PLATFORM_CONFIGS_I = namedInterface<LinePlatformConfigs>({
  name: 'LinePlatformConfigs',
});

export const LINE_PLATFORM_MOUNTER_I = namedInterface<LinePlatformMounter>({
  name: 'LinePlatformMounter',
});
