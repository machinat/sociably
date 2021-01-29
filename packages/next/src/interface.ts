import { makeInterface } from '@machinat/core/service';
import type { NextConfigs, NextPlatformMounter, NextServer } from './types';

/**
 * @category Interface
 */
export const PlatformMounterI = makeInterface<NextPlatformMounter>({
  name: 'NextPlatformMounterI',
});

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<NextConfigs>({
  name: 'NextConfigsI',
});

export type ConfigsI = NextConfigs;

/**
 * @category Interface
 */
export const ServerI = makeInterface<NextServer>({
  name: 'NextServerI',
});

export type ServerI = NextServer;
