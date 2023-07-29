import { serviceInterface } from '@sociably/core';
import { MetaApiModuleConfigs } from './types.js';

export const ConfigsI = serviceInterface<MetaApiModuleConfigs>({
  name: 'MetaApiConfigs',
});

export type ConfigsI = MetaApiModuleConfigs;
