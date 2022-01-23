import { createServer } from 'http';
import thenifiedly from 'thenifiedly';
import { ServiceModule } from '@machinat/core';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import {
  ServerI,
  ConfigsI,
  RequestRouteListI,
  UpgradeRouteListI,
} from './interface';
import { ConnectorP } from './connector';

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
      deps: [ConnectorP, ServerI, ConfigsI],
    })(async (connector, server, { listenOptions, noServer }) => {
      if (!noServer) {
        await connector.connect(server, listenOptions);
      }
    }),
    stopHook: makeContainer({ deps: [ServerI] })((server) =>
      thenifiedly.callMethod('close', server)
    ),
  });
}

export default Http;
