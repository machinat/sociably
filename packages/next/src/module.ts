import createNextServer from 'next';
import { makeFactoryProvider, makeContainer } from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';
import type { PlatformModule, ServiceModule } from '@machinat/core/types';
import { ReceiverP } from './receiver';
import { MODULE_CONFIGS_I, PLATFORM_MOUNTER_I, SERVER_I } from './interface';
import type {
  NextModuleConfigs,
  NextEventContext,
  NextResponse,
} from './types';

/** @internal */
const nextServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [MODULE_CONFIGS_I] as const,
})(({ serverOptions }) => createNextServer(serverOptions || {}));

/** @internal */
const routingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ReceiverP, MODULE_CONFIGS_I] as const,
})(
  (receiver, configs): RequestRoute => ({
    name: 'next',
    path: configs.entryPath || '/',
    handler: receiver.handleRequestCallback(),
  })
);

const Next = {
  Receiver: ReceiverP,
  CONFIGS_I: MODULE_CONFIGS_I,
  SERVER_I,

  initModule: (
    configs: NextModuleConfigs = {}
  ): ServiceModule &
    PlatformModule<NextEventContext, NextResponse, never, never, never> => ({
    name: 'next',
    mounterInterface: PLATFORM_MOUNTER_I,
    eventMiddlewares: configs.eventMiddlewares,

    provisions: [
      ReceiverP,
      { provide: MODULE_CONFIGS_I, withValue: configs },
      { provide: SERVER_I, withProvider: nextServerFactory },
      { provide: Http.REQUEST_ROUTES_I, withProvider: routingFactory },
    ],

    startHook: makeContainer({
      deps: [ReceiverP],
    })((receiver) => receiver.prepare()),
  }),
};

declare namespace Next {
  export type Receiver = ReceiverP;
}

export default Next;
