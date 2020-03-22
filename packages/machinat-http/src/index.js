// @flow
import HTTPConnector from './connector';
import { HTTP_MODULE_CONFIGS_I, HTTPServerI } from './interface';
import initModule from './module';

const HTTP = {
  initModule,
  CONFIGS_I: HTTP_MODULE_CONFIGS_I,
  ServerI: HTTPServerI,
  Connector: HTTPConnector,
};

export default HTTP;
