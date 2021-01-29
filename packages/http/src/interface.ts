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
  name: 'HttpServerI',
});

export type ServerI = Server;

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<HttpConfigs>({
  name: 'HttpConfigsI',
});

export type ConfigsI = HttpConfigs;

/**
 * @category Interface
 */
export const RequestRouteList = makeInterface<
  RequestRoute | DefaultRequestRoute
>({
  name: 'HttpRequestRouteList',
  multi: true,
});

export type RequestRouteList = (RequestRoute | DefaultRequestRoute)[];

/**
 * @category Interface
 */
export const UpgradeRouteList = makeInterface<
  UpgradeRoute | DefaultUpgradeRoute
>({
  name: 'HttpUpgradeRouteList',
  multi: true,
});

export type UpgradeRouteList = (UpgradeRoute | DefaultUpgradeRoute)[];
