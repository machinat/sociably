import createNextApp from 'next';
import { factory, container } from '@machinat/core/service';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';
import type { PlatformModule, ServiceModule } from '@machinat/core/types';
import NextReceiver from './receiver';
import { MODULE_CONFIGS_I, PLATFORM_MOUNTER_I, SERVER_I } from './interface';
import type {
  NextServer,
  NextModuleConfigs,
  NextEventContext,
  NextResponse,
} from './types';

const nextServerFactory = factory<NextServer>({
  lifetime: 'singleton',
  deps: [MODULE_CONFIGS_I],
})((configs: NextModuleConfigs) => createNextApp(configs.nextAppOptions || {}));

const routingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [NextReceiver, MODULE_CONFIGS_I],
})((receiver: NextReceiver, configs: NextModuleConfigs) => ({
  name: 'next',
  path: configs.entryPath || '/',
  handler: receiver.handleRequestCallback(),
}));

const Next = {
  Receiver: NextReceiver,
  CONFIGS_I: MODULE_CONFIGS_I,
  SERVER_I,

  initModule: (
    configs: NextModuleConfigs = {}
  ): ServiceModule &
    PlatformModule<NextEventContext, NextResponse, any, any, any> => ({
    name: 'next',
    mounterInterface: PLATFORM_MOUNTER_I,
    eventMiddlewares: configs.eventMiddlewares,

    provisions: [
      NextReceiver,
      { provide: MODULE_CONFIGS_I, withValue: configs },
      { provide: SERVER_I, withProvider: nextServerFactory },
      { provide: HTTP.REQUEST_ROUTINGS_I, withProvider: routingFactory },
    ],

    startHook: container<Promise<void>>({
      deps: [NextReceiver],
    })((receiver: NextReceiver) => receiver.prepare()),
  }),
};

export default Next;
