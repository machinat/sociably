import { makeInterface } from '@machinat/core/service';
import type {
  MessengerPlatformMounter,
  MessengerPlatformConfigs,
} from './types';

export const PLATFORM_CONFIGS_I = makeInterface<
  MessengerPlatformConfigs
>({ name: 'MessengerPlatformConfigs' });

export const PLATFORM_MOUNTER_I = makeInterface<
  MessengerPlatformMounter
>({ name: 'MessengerPlatformMounter' });
