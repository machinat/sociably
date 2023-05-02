import type { Server } from 'http';
import { serviceInterface } from '@sociably/core/service';
import type {
  HttpConfigs,
  RequestRoute,
  DefaultRequestRoute,
  UpgradeRoute,
  DefaultUpgradeRoute,
} from './types';

export const ServerI = serviceInterface<Server>({
  name: 'HttpServer',
});

export type ServerI = Server;

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<HttpConfigs>({
  name: 'HttpConfigs',
});

export type ConfigsI = HttpConfigs;

/**
 * @category Interface
 */
export const RequestRouteListI = serviceInterface<
  RequestRoute | DefaultRequestRoute
>({
  name: 'HttpRequestRouteList',
  multi: true,
});

export type RequestRouteListI = (RequestRoute | DefaultRequestRoute)[];

/**
 * @category Interface
 */
export const UpgradeRouteListI = serviceInterface<
  UpgradeRoute | DefaultUpgradeRoute
>({
  name: 'HttpUpgradeRouteList',
  multi: true,
});

export type UpgradeRouteListI = (UpgradeRoute | DefaultUpgradeRoute)[];
