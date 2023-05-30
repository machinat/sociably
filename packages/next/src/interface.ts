import { serviceInterface } from '@sociably/core/service';
import type { NextConfigs, NextServer } from './types.js';

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<NextConfigs>({
  name: 'NextConfigs',
});

export type ConfigsI = NextConfigs;

/**
 * @category Interface
 */
export const ServerI = serviceInterface<NextServer>({
  name: 'NextServer',
});

export type ServerI = NextServer;
