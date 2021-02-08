import { createServer } from 'http';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { ServiceModule } from '@machinat/core/types';
import {
  ServerI as HttpServerI,
  ConfigsI as HttpConfigsI,
  RequestRouteList as HttpRequestRouteList,
  UpgradeRouteList as HttpUpgradeRouteList,
} from './interface';
import { ConnectorP } from './connector';

/** @internal */
const httpServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
})(() => createServer());

/**
 * @category Root
 */
const Http = {
  ConfigsI: HttpConfigsI,
  ServerI: HttpServerI,
  Connector: ConnectorP,
  RequestRouteList: HttpRequestRouteList,
  UpgradeRouteList: HttpUpgradeRouteList,

  initModule: (configsInput: HttpConfigsI): ServiceModule => ({
    provisions: [
      ConnectorP,
      { provide: HttpConfigsI, withValue: configsInput },
      { provide: HttpServerI, withProvider: httpServerFactory },
    ],
    startHook: makeContainer({
      deps: [ConnectorP, HttpServerI, HttpConfigsI] as const,
    })((connector, server, { listenOptions }) =>
      connector.connect(server, listenOptions)
    ),
  }),
};

/**
 * @category Root
 */
declare namespace Http {
  export type Connector = ConnectorP;
  export type ServerI = HttpServerI;
  export type ConfigsI = HttpConfigsI;
  export type RequestRouteList = HttpRequestRouteList;
  export type UpgradeRouteList = HttpUpgradeRouteList;
}

export default Http;
