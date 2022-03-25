import createNextServer from 'next';
import type { ServiceModule } from '@machinat/core';
import {
  makeFactoryProvider,
  makeContainer,
  ServiceProvision,
} from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute, UpgradeRoute } from '@machinat/http';
import { ReceiverP } from './receiver';
import { ConfigsI, ServerI } from './interface';

const nextServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [ConfigsI],
})(({ serverOptions }) => createNextServer((serverOptions || {}) as {}));

const requestRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ReceiverP, ConfigsI],
})(
  (receiver, configs): RequestRoute => ({
    name: 'next',
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const hmrRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ReceiverP, ConfigsI],
})(
  (receiver, configs): UpgradeRoute => ({
    name: 'webpack-hmr',
    path: configs.entryPath || '/',
    handler: receiver.handleHmrUpgradeCallback(),
  })
);

/**
 * @category Root
 */
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
      startHook: makeContainer({ deps: [ReceiverP] })((receiver) =>
        receiver.prepare()
      ),
      stopHook: makeContainer({ deps: [ReceiverP] })((receiver) =>
        receiver.close()
      ),
    };
  };
}

export default Next;
