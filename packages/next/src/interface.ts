import { makeInterface } from '@machinat/core/service';
import type { NextConfigs, NextPlatformMounter, NextServer } from './types';

/**
 * @category Interface
 */
export const PlatformMounterI = makeInterface<NextPlatformMounter>({
  name: 'NextPlatformMounter',
});

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<NextConfigs>({
  name: 'NextConfigs',
});

export type ConfigsI = NextConfigs;

/**
 * @category Interface
 */
export const ServerI = makeInterface<NextServer>({
  name: 'NextServer',
});

export type ServerI = NextServer;
