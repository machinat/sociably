import { createServer } from 'http';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { ServiceModule } from '@machinat/core/types';
import {
  ServerI,
  ConfigsI,
  RequestRouteListI,
  UpgradeRouteListI,
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
  Configs: ConfigsI,
  Server: ServerI,
  Connector: ConnectorP,
  RequestRouteList: RequestRouteListI,
  UpgradeRouteList: UpgradeRouteListI,

  initModule: (configsInput: ConfigsI): ServiceModule => ({
    provisions: [
      ConnectorP,
      { provide: ConfigsI, withValue: configsInput },
      { provide: ServerI, withProvider: httpServerFactory },
    ],
    startHook: makeContainer({
      deps: [ConnectorP, ServerI, ConfigsI] as const,
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
  export type Server = ServerI;
  export type Configs = ConfigsI;
  export type RequestRouteList = RequestRouteListI;
  export type UpgradeRouteList = UpgradeRouteListI;
}

export default Http;
