import { makeInterface } from '@sociably/core/service';
import type { NextConfigs, NextServer } from './types';

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
