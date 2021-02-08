import createNextServer from 'next';
import { makeFactoryProvider, makeContainer } from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';
import type { PlatformModule, ServiceModule } from '@machinat/core/types';
import { ReceiverP } from './receiver';
import { ConfigsI, ServerI, PlatformMounterI } from './interface';
import type { NextEventContext, NextResponse } from './types';

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
const Next = {
  Receiver: ReceiverP,
  Configs: ConfigsI,
  Server: ServerI,

  initModule: (
    configs: ConfigsI = {}
  ): ServiceModule &
    PlatformModule<NextEventContext, NextResponse, never, never, never> => ({
    name: 'next',
    mounterInterface: PlatformMounterI,
    eventMiddlewares: configs.eventMiddlewares,

    provisions: [
      ReceiverP,
      { provide: ConfigsI, withValue: configs },
      { provide: ServerI, withProvider: nextServerFactory },
      { provide: Http.RequestRouteList, withProvider: routingFactory },
    ],

    startHook: makeContainer({
      deps: [ReceiverP],
    })((receiver) => receiver.prepare()),
  }),
};

/**
 * @category Root
 */
declare namespace Next {
  export type Receiver = ReceiverP;
  export type Configs = ConfigsI;
  export type Server = ServerI;
}

export default Next;
