// @flow
import createNextApp from 'next';
import { factory, container } from '@machinat/core/service';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';
import type { PlatformModule, ServiceModule } from '@machinat/core/types';
import NextReceiver from './receiver';
import {
  NEXT_MODULE_CONFIGS_I,
  NEXT_PLATFORM_MOUNTER_I,
  NextServerI,
} from './interface';
import type {
  NextModuleConfigs,
  NextEventContext,
  NextResponse,
} from './types';

const nextServerFactory = factory<any>({
  lifetime: 'singleton',
  deps: [NEXT_MODULE_CONFIGS_I],
})((configs: NextModuleConfigs) => createNextApp(configs.nextAppOptions));

const routingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [NextReceiver, NEXT_MODULE_CONFIGS_I],
})((receiver: NextReceiver, configs: NextModuleConfigs) => ({
  name: 'next',
  path: configs.entryPath || '/',
  handler: receiver.handleRequestCallback(),
}));

const Next = {
  Receiver: NextReceiver,
  CONFIGS_I: NEXT_MODULE_CONFIGS_I,
  ServerI: NextServerI,

  initModule: (
    configs: NextModuleConfigs = {}
  ): ServiceModule &
    PlatformModule<NextEventContext, NextResponse, any, any, any> => ({
    name: 'next',
    mounterInterface: NEXT_PLATFORM_MOUNTER_I,
    provisions: [
      NextReceiver,
      { provide: NEXT_MODULE_CONFIGS_I, withValue: configs },
      { provide: NextServerI, withProvider: nextServerFactory },
      { provide: HTTP.REQUEST_ROUTINGS_I, withProvider: routingFactory },
    ],
    startHook: container<Promise<void>>({
      deps: [NextReceiver],
    })((receiver: NextReceiver) => receiver.prepare()),
    eventMiddlewares: configs.eventMiddlewares,
  }),
};

export default Next;
