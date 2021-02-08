import type { Server } from 'http';
import { makeInterface } from '@machinat/core/service';
import type {
  HttpConfigs,
  RequestRoute,
  DefaultRequestRoute,
  UpgradeRoute,
  DefaultUpgradeRoute,
} from './types';

export const ServerI = makeInterface<Server>({
  name: 'HttpServer',
});

export type ServerI = Server;

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<HttpConfigs>({
  name: 'HttpConfigs',
});

export type ConfigsI = HttpConfigs;

/**
 * @category Interface
 */
export const RequestRouteListI = makeInterface<
  RequestRoute | DefaultRequestRoute
>({
  name: 'HttpRequestRouteList',
  multi: true,
});

export type RequestRouteListI = (RequestRoute | DefaultRequestRoute)[];

/**
 * @category Interface
 */
export const UpgradeRouteListI = makeInterface<
  UpgradeRoute | DefaultUpgradeRoute
>({
  name: 'HttpUpgradeRouteList',
  multi: true,
});

export type UpgradeRouteListI = (UpgradeRoute | DefaultUpgradeRoute)[];
