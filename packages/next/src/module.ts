import createNextServer from 'next';
import { makeFactoryProvider, makeContainer } from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';
import type { ServiceModule } from '@machinat/core/types';
import { ReceiverP } from './receiver';
import { ConfigsI, ServerI } from './interface';

/** @internal */
const nextServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [ConfigsI] as const,
})(({ serverOptions }) => createNextServer(serverOptions || {}));

/** @internal */
const routingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ReceiverP, ConfigsI] as const,
})(
  (receiver, configs): RequestRoute => ({
    name: 'next',
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
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

  export const initModule = (configs: ConfigsI = {}): ServiceModule => ({
    provisions: [
      ReceiverP,
      { provide: ConfigsI, withValue: configs },
      { provide: ServerI, withProvider: nextServerFactory },
      { provide: Http.RequestRouteList, withProvider: routingFactory },
    ],

    startHook: makeContainer({ deps: [ReceiverP] })((receiver) =>
      receiver.prepare()
    ),
  });
}

export default Next;
