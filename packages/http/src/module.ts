import { createServer } from 'http';
import thenifiedly from 'thenifiedly';
import { ServiceModule } from '@machinat/core';
import {
  ServiceProvision,
  makeContainer,
  makeFactoryProvider,
} from '@machinat/core/service';

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

  export const initModule = (configs: ConfigsI): ServiceModule => {
    const provisions: ServiceProvision<any>[] = [
      ConnectorP,
      { provide: ConfigsI, withValue: configs },
    ];

    if (!configs.noServer) {
      provisions.push({ provide: ServerI, withProvider: httpServerFactory });
    }

    return {
      provisions,
      startHook: makeContainer({
        deps: [ConnectorP, { require: ServerI, optional: true }, ConfigsI],
      })(async (connector, server, { listenOptions, noServer }) => {
        if (server && !noServer) {
          await connector.connect(server, listenOptions);
        }
      }),
      stopHook: makeContainer({
        deps: [{ require: ServerI, optional: true }, ConfigsI],
      })(async (server, { noServer }) => {
        if (server && !noServer) {
          await thenifiedly.callMethod('close', server);
        }
      }),
    };
  };
}

export default Http;
