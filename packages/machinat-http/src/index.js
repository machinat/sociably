// @flow
import HTTPConnector from './connector';
import { HTTP_MODULE_CONFIGS_I, HTTPServer } from './interface';
import initModule from './module';

const HTTP = {
  initModule,
  CONFIGS: HTTP_MODULE_CONFIGS_I,
  Connector: HTTPConnector,
  Server: HTTPServer,
};

export default HTTP;
