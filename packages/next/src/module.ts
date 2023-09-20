import NextJs from 'next';
import type { ServiceModule } from '@sociably/core';
import {
  serviceProviderFactory,
  serviceContainer,
  ServiceProvision,
} from '@sociably/core/service';
import Http from '@sociably/http';
import type { RequestRoute, UpgradeRoute } from '@sociably/http';
import { ReceiverP } from './Receiver.js';
import { ConfigsI, ServerI } from './interface.js';

// HACK: NextJs type is not compatible with moduleResolution: Node16
const createNextServer = NextJs as unknown as typeof NextJs.default;

const nextServerFactory = serviceProviderFactory({
  lifetime: 'singleton',
  deps: [ConfigsI],
})(({ serverOptions }) => createNextServer((serverOptions || {}) as {}));

const requestRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ReceiverP, ConfigsI],
})(
  (receiver, configs): RequestRoute => ({
    name: 'next',
    path: configs.entryPath || '.',
    handler: receiver.handleRequestCallback(),
  }),
);

const hmrRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ReceiverP, ConfigsI],
})(
  (receiver, configs): UpgradeRoute => ({
    name: 'webpack-hmr',
    path: configs.entryPath || '.',
    handler: receiver.handleHmrUpgradeCallback(),
  }),
);

/** @category Root */
namespace Next {
  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Server = ServerI;
  export type Server = ServerI;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: ConfigsI = {}): ServiceModule => {
    const provisions: ServiceProvision<unknown>[] = [
      ReceiverP,
      { provide: ConfigsI, withValue: configs },
      { provide: ServerI, withProvider: nextServerFactory },
      { provide: Http.RequestRouteList, withProvider: requestRouteFactory },
    ];

    if (configs.serverOptions?.dev) {
      provisions.push({
        provide: Http.UpgradeRouteList,
        withProvider: hmrRouteFactory,
      });
    }

    return {
      provisions,
      startHook: serviceContainer({ deps: [ReceiverP] })((receiver) =>
        receiver.prepare(),
      ),
      stopHook: serviceContainer({ deps: [ReceiverP] })((receiver) =>
        receiver.close(),
      ),
    };
  };
}

export default Next;
