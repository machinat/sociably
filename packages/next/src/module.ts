import createNextServer from 'next';
import { makeFactoryProvider, makeContainer } from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';
import type { PlatformModule, ServiceModule } from '@machinat/core/types';
import { ReceiverP } from './receiver';
import {
  ConfigsI as NextConfigsI,
  ServerI as NextServerI,
  PlatformMounterI,
} from './interface';
import type { NextEventContext, NextResponse } from './types';

/** @internal */
const nextServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [NextConfigsI] as const,
})(({ serverOptions }) => createNextServer(serverOptions || {}));

/** @internal */
const routingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ReceiverP, NextConfigsI] as const,
})(
  (receiver, configs): RequestRoute => ({
    name: 'next',
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const Next = {
  Receiver: ReceiverP,
  ConfigsI: NextConfigsI,
  ServerI: NextServerI,

  initModule: (
    configs: NextConfigsI = {}
  ): ServiceModule &
    PlatformModule<NextEventContext, NextResponse, never, never, never> => ({
    name: 'next',
    mounterInterface: PlatformMounterI,
    eventMiddlewares: configs.eventMiddlewares,

    provisions: [
      ReceiverP,
      { provide: NextConfigsI, withValue: configs },
      { provide: NextServerI, withProvider: nextServerFactory },
      { provide: Http.RequestRouteList, withProvider: routingFactory },
    ],

    startHook: makeContainer({
      deps: [ReceiverP],
    })((receiver) => receiver.prepare()),
  }),
};

declare namespace Next {
  export type Receiver = ReceiverP;
  export type ConfigsI = NextConfigsI;
  export type ServerI = NextServerI;
}

export default Next;
