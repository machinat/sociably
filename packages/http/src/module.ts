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
namespace Http {
  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const Server = ServerI;
  export type Server = ServerI;

  export const Connector = ConnectorP;
  export type Connector = ConnectorP;

  export const RequestRouteList = RequestRouteListI;
  export type RequestRouteList = RequestRouteListI;

  export const UpgradeRouteList = UpgradeRouteListI;
  export type UpgradeRouteList = UpgradeRouteListI;

  export const initModule = (configsInput: ConfigsI): ServiceModule => ({
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
  });
}

export default Http;
