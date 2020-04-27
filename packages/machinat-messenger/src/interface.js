// @flow
import { namedInterface } from '@machinat/core/service';
import type {
  MessengerPlatformMounter,
  MessengerPlatformConfigs,
} from './types';

export const MESSENGER_PLATFORM_CONFIGS_I = namedInterface<MessengerPlatformConfigs>(
  { name: 'MessengerPlatformConfigs' }
);

export const MESSENGER_PLATFORM_MOUNTER_I = namedInterface<MessengerPlatformMounter>(
  { name: 'MessengerPlatformMounter' }
);
