import nextApp from 'next';
import type { NextServer, NextModuleConfigs } from '../types';

const createNextServer = (configs: NextModuleConfigs): NextServer =>
  nextApp(configs.serverOptions || {});

export default createNextServer;
