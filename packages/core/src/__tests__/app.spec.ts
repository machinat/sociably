import moxy, { Moxy } from '@moxyjs/moxy';
import {
  makeContainer,
  makeClassProvider,
  makeFactoryProvider,
  makeInterface,
} from '../service';
import BaseBotP from '../base/Bot';
import BaseProfilerP from '../base/Profiler';
import BaseMarshalerP from '../base/Marshaler';
import ModuleUtilitiesI from '../base/ModuleUtilities';
import ServiceScope from '../service/scope';
import App from '../app';

const useModuleUtils = moxy(() => ({}));

const TestService = moxy(
  makeClassProvider({
    lifetime: 'transient',
  })(class TestService {})
);

const TestModule = moxy({
  provisions: [
    TestService,
    makeFactoryProvider({
      lifetime: 'singleton',
      deps: [ModuleUtilitiesI],
    })(useModuleUtils),
  ],
  startHook: makeContainer({ deps: [TestService] })(async () => {}),
  stopHook: makeContainer({ deps: [TestService] })(async () => {}),
});

const AnotherService = moxy(
  makeClassProvider({
    deps: [TestService],
    lifetime: 'scoped',
  })(class AnotherService {})
);

const AnotherModule = moxy({
  provisions: [AnotherService],
  startHook: makeContainer({
    deps: [TestService, AnotherService],
  })(async () => {}),
  stopHook: makeContainer({
    deps: [TestService, AnotherService],
  })(async () => {}),
});

const FooService = moxy(
  makeClassProvider({
    deps: [TestService, AnotherService],
    lifetime: 'singleton',
  })(class FooService {})
);

const TestPlatformUtilsI = makeInterface({ name: 'TestPlatformUtils' });
const useTestPlatformUtils = moxy(() => ({}));

const FooPlatform = moxy(
  {
    name: 'foo',
    provisions: [
      FooService,
      makeFactoryProvider({
        lifetime: 'singleton',
        deps: [TestPlatformUtilsI, ModuleUtilitiesI],
      })(useTestPlatformUtils),
    ],
    utilitiesInterface: TestPlatformUtilsI,
    startHook: makeContainer({
      deps: [TestService, AnotherService, FooService],
    })(async () => {}),
    stopHook: makeContainer({
      deps: [TestService, AnotherService, FooService],
    })(async () => {}),
    eventMiddlewares: [
      (ctx, next) => next(ctx),
      (ctx, next) => next(ctx),
      (ctx, next) => next(ctx),
    ],
    dispatchMiddlewares: [
      (frame, next) => next(frame),
      (frame, next) => next(frame),
      (frame, next) => next(frame),
    ],
  } as never,
  { includeProperties: ['eventMiddlewares', 'dispatchMiddlewares'] }
);

const BarService = moxy(
  makeClassProvider({
    deps: [TestService, AnotherService],
    lifetime: 'scoped',
  })(class BarService {})
);

const AnotherPlatformUtilsI = makeInterface({ name: 'AnotherPlatformUtils' });
const useAnotherPlatformUtils = moxy(() => ({}));

const BarPlatform = moxy({
  name: 'bar',
  utilitiesInterface: AnotherPlatformUtilsI,
  provisions: [
    BarService,
    makeFactoryProvider({
      deps: [AnotherPlatformUtilsI],
      lifetime: 'singleton',
    })(useAnotherPlatformUtils),
  ],
  startHook: makeContainer({
    deps: [TestService, AnotherService, BarService],
  })(async () => {}),
  stopHook: makeContainer({
    deps: [TestService, AnotherService, BarService],
  })(async () => {}),
});

const MyService = moxy(
  makeClassProvider({
    deps: [TestService, AnotherService, FooService, BarService],
    lifetime: 'scoped',
  })(class MyService {})
);

const YourService = moxy(
  makeClassProvider({
    deps: [TestService, AnotherService, FooService, BarService, MyService],
    lifetime: 'transient',
  })(class YourService {})
);

beforeEach(() => {
  TestService.mock.reset();
  TestModule.mock.reset();
  AnotherService.mock.reset();
  AnotherModule.mock.reset();
  FooService.mock.reset();
  FooPlatform.mock.reset();
  BarService.mock.reset();
  BarPlatform.mock.reset();
  MyService.mock.reset();
  YourService.mock.reset();

  useModuleUtils.mock.reset();
  useTestPlatformUtils.mock.reset();
  useAnotherPlatformUtils.mock.reset();
});

it('start modules', async () => {
  const app = new App({
    modules: [TestModule, AnotherModule],
    platforms: [FooPlatform, BarPlatform],
    services: [MyService, YourService],
  });

  await app.start();

  // trasient service created when boostrap and each time module startHook injected
  expect(TestService.$$factory).toHaveBeenCalledTimes(5);
  expect(TestService.$$factory).toHaveBeenCalledWith(/* empty */);
  expect(
    (TestModule.startHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledTimes(1);
  expect(
    (TestModule.startHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledWith(expect.any(TestService));

  expect(AnotherService.$$factory).toHaveBeenCalledTimes(1);
  expect(AnotherService.$$factory).toHaveBeenCalledWith(
    expect.any(TestService)
  );
  expect(
    (AnotherModule.startHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledTimes(1);
  expect(
    (AnotherModule.startHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledWith(expect.any(TestService), expect.any(AnotherService));

  expect(FooService.$$factory).toHaveBeenCalledTimes(1);
  expect(FooService.$$factory).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService)
  );
  expect(FooPlatform.startHook.$$factory).toHaveBeenCalledTimes(1);
  expect(FooPlatform.startHook.$$factory).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService),
    expect.any(FooService)
  );

  expect(BarService.$$factory).toHaveBeenCalledTimes(1);
  expect(BarService.$$factory).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService)
  );
  expect(
    (BarPlatform.startHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledTimes(1);
  expect(
    (BarPlatform.startHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService),
    expect.any(BarService)
  );

  expect(MyService.$$factory).not.toHaveBeenCalled();
  expect(YourService.$$factory).not.toHaveBeenCalled();
});

it('provide platform utilities bound to utilitiesInterface', async () => {
  const app = new App({
    modules: [TestModule, AnotherModule],
    platforms: [FooPlatform, BarPlatform],
    services: [MyService, YourService],
  });

  await app.start();

  expect(useTestPlatformUtils).toHaveBeenCalledTimes(1);
  expect(useTestPlatformUtils).toHaveBeenCalledWith(
    {
      popEventWrapper: expect.any(Function),
      dispatchWrapper: expect.any(Function),
    },
    {
      initScope: expect.any(Function),
      popError: expect.any(Function),
    }
  );
  expect(useAnotherPlatformUtils).toHaveBeenCalledTimes(1);
  expect(useAnotherPlatformUtils).toHaveBeenCalledWith({
    popEventWrapper: expect.any(Function),
    dispatchWrapper: expect.any(Function),
  });
});

test('#stop() calls stopHook of platfroms & modules', async () => {
  const app = new App({
    modules: [TestModule, AnotherModule],
    platforms: [FooPlatform, BarPlatform],
    services: [MyService, YourService],
  });

  await app.start();

  expect(
    (TestModule.stopHook.$$factory as Moxy<() => unknown>).mock
  ).not.toHaveBeenCalled();
  expect(
    (AnotherModule.stopHook.$$factory as Moxy<() => unknown>).mock
  ).not.toHaveBeenCalled();
  expect(FooPlatform.stopHook.$$factory).not.toHaveBeenCalled();
  expect(
    (BarPlatform.stopHook.$$factory as Moxy<() => unknown>).mock
  ).not.toHaveBeenCalled();

  await app.stop();

  expect(
    (TestModule.stopHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledTimes(1);
  expect(
    (TestModule.stopHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledWith(expect.any(TestService));

  expect(
    (AnotherModule.stopHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledTimes(1);
  expect(
    (AnotherModule.stopHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledWith(expect.any(TestService), expect.any(AnotherService));

  expect(FooPlatform.stopHook.$$factory).toHaveBeenCalledTimes(1);
  expect(FooPlatform.stopHook.$$factory).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService),
    expect.any(FooService)
  );

  expect(
    (BarPlatform.stopHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledTimes(1);
  expect(
    (BarPlatform.stopHook.$$factory as Moxy<() => unknown>).mock
  ).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService),
    expect.any(BarService)
  );
});

describe('module utilities', () => {
  const eventListener = moxy();
  const errorListener = moxy();

  beforeEach(() => {
    eventListener.mock.clear();
    errorListener.mock.clear();
  });

  test('initScope', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });

    await app.start();

    const { initScope } = useModuleUtils.mock.calls[0].args[0];
    const scope = initScope();
    expect(scope).toBeInstanceOf(ServiceScope);

    expect(
      scope.useServices([
        TestService,
        AnotherService,
        FooService,
        BarService,
        MyService,
        YourService,
      ])
    ).toEqual([
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(FooService),
      expect.any(BarService),
      expect.any(MyService),
      expect.any(YourService),
    ]);
  });

  test('popError', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popError } = useModuleUtils.mock.calls[0].args[0];
    expect(popError(new Error("Don't call again!"))).toBe(undefined);

    expect(eventListener).not.toHaveBeenCalled();
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledWith(new Error("Don't call again!"));
  });

  test('listen error using DI container', async () => {
    const containedListener = moxy();
    const errorListnerContainer = moxy(
      makeContainer({
        deps: [
          FooService,
          BarService,
          TestService,
          AnotherService,
          MyService,
          YourService,
        ],
      })(() => containedListener)
    );

    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListnerContainer);

    await app.start();

    const { popError } = useModuleUtils.mock.calls[0].args[0];
    popError(new Error('hello container'));

    expect(errorListnerContainer.$$factory).toHaveBeenCalledTimes(1);
    expect(errorListnerContainer.$$factory).toHaveBeenCalledWith(
      expect.any(FooService),
      expect.any(BarService),
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedListener).toHaveBeenCalledTimes(1);
    expect(containedListener).toHaveBeenCalledWith(
      new Error('hello container')
    );
  });
});

describe('popEventWrapper', () => {
  const eventContext = {
    platform: 'test',
    thread: { phone: 'call' },
    event: { text: 'Is Champ there?' },
    user: { name: 'Johnnnnn Ceeeena!' },
    metadata: { wwe: 'super slam' },
  };

  const finalHandler = moxy(() => ({ only: 49.99 }));
  const eventListener = moxy();
  const errorListener = moxy();

  beforeEach(() => {
    finalHandler.mock.reset();
    eventListener.mock.clear();
    errorListener.mock.clear();
  });

  test('pop event through middlewares', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popEventWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      only: 49.99,
    });

    expect(finalHandler).toHaveBeenCalledTimes(1);
    expect(finalHandler).toHaveBeenCalledWith(eventContext);

    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(eventListener).toHaveBeenCalledWith(eventContext);
    expect(errorListener).not.toHaveBeenCalled();

    for (const middleware of FooPlatform.eventMiddlewares) {
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(middleware).toHaveBeenCalledWith(
        eventContext,
        expect.any(Function)
      );
    }
  });

  test('modify context and reponse within middleware', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    FooPlatform.eventMiddlewares[0].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ping: 0 })),
      pong: 0,
    }));
    FooPlatform.eventMiddlewares[1].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ding: 1 })),
      dong: 1,
    }));
    FooPlatform.eventMiddlewares[2].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ling: 2 })),
      long: 2,
    }));

    const { popEventWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      only: 49.99,
      pong: 0,
      dong: 1,
      long: 2,
    });

    const modifiedContext = { ...eventContext, ping: 0, ding: 1, ling: 2 };

    expect(finalHandler).toHaveBeenCalledTimes(1);
    expect(finalHandler).toHaveBeenCalledWith(modifiedContext);

    expect(eventListener).toHaveBeenCalledTimes(1);
    expect(eventListener).toHaveBeenCalledWith(modifiedContext);
    expect(errorListener).not.toHaveBeenCalled();
  });

  test('bypass the finalHandler within middleware', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    FooPlatform.eventMiddlewares[1].mock.fake(async () => ({
      hello: 'and bye!',
    }));

    const { popEventWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      hello: 'and bye!',
    });

    expect(FooPlatform.eventMiddlewares[0]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[1]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[2]).not.toHaveBeenCalled();
    expect(finalHandler).not.toHaveBeenCalled();
    expect(eventListener).not.toHaveBeenCalled();
    expect(errorListener).not.toHaveBeenCalled();
  });

  test('error thrown within middleware', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    FooPlatform.eventMiddlewares[1].mock.fake(async () => {
      throw new Error("I'll call police!");
    });

    const { popEventWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).rejects.toThrow(
      "I'll call police!"
    );

    expect(FooPlatform.eventMiddlewares[0]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[1]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[2]).not.toHaveBeenCalled();
    expect(finalHandler).not.toHaveBeenCalled();
    expect(eventListener).not.toHaveBeenCalled();
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledWith(new Error("I'll call police!"));
  });

  test('error thrown within finalHandler', async () => {
    finalHandler.mock.fake(async () => {
      throw new Error('DO~DOO~DOOOO~DO~');
    });

    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popEventWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).rejects.toThrow(
      'DO~DOO~DOOOO~DO~'
    );

    expect(FooPlatform.eventMiddlewares[0]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[1]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[2]).toHaveBeenCalledTimes(1);
    expect(eventListener).not.toHaveBeenCalled();
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener).toHaveBeenCalledWith(new Error('DO~DOO~DOOOO~DO~'));
  });

  test('catch error within middleware', async () => {
    finalHandler.mock.fake(async () => {
      throw new Error('DO~DOO~DOOOO~DO~');
    });

    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    FooPlatform.eventMiddlewares[0].mock.fake(async (ctx, next) => {
      try {
        const response = await next(ctx);
        return response;
      } catch (err) {
        return { hello: err.message };
      }
    });

    const { popEventWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      hello: 'DO~DOO~DOOOO~DO~',
    });

    expect(FooPlatform.eventMiddlewares[0]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[1]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[2]).toHaveBeenCalledTimes(1);
    expect(finalHandler).toHaveBeenCalledTimes(1);
    expect(eventListener).not.toHaveBeenCalled();
    expect(errorListener).not.toHaveBeenCalled();
  });

  test('use service container for event listener', async () => {
    const containedListener = moxy();
    const eventListenerContainer = moxy(
      makeContainer({
        deps: [
          FooService,
          BarService,
          TestService,
          AnotherService,
          MyService,
          YourService,
        ],
      })(() => containedListener)
    );

    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListenerContainer)
      .onError(errorListener);

    await app.start();
    const { popEventWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await popEventWrapper(finalHandler)(eventContext);

    expect(eventListenerContainer.$$factory).toHaveBeenCalledTimes(1);
    expect(eventListenerContainer.$$factory).toHaveBeenCalledWith(
      expect.any(FooService),
      expect.any(BarService),
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedListener).toHaveBeenCalledTimes(1);
    expect(containedListener).toHaveBeenCalledWith(eventContext);
  });

  test('use service container for middleware', async () => {
    const containedMiddleware = moxy((ctx, next) => next(ctx));
    const middlewareContainer = moxy(
      makeContainer({
        deps: [
          FooService,
          BarService,
          TestService,
          AnotherService,
          MyService,
          YourService,
        ],
      })(() => containedMiddleware)
    );

    FooPlatform.mock
      .getter('eventMiddlewares')
      .fakeReturnValue([middlewareContainer]);

    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popEventWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      only: 49.99,
    });

    expect(eventListener).toHaveBeenCalledTimes(1);

    expect(middlewareContainer.$$factory).toHaveBeenCalledTimes(1);
    expect(middlewareContainer.$$factory).toHaveBeenCalledWith(
      expect.any(FooService),
      expect.any(BarService),
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedMiddleware).toHaveBeenCalledTimes(1);
    expect(containedMiddleware).toHaveBeenCalledWith(
      eventContext,
      expect.any(Function)
    );
  });
});

describe('dispatchWrapper', () => {
  const dispatchFrame = {
    platform: 'test',
    thread: { a: 'new hope' },
    bot: { droid: 'r2d2' },
    tasks: [{ type: 'dispatch', payload: [{ find: 'Obi-Wan Kenobi' }] }],
  };

  const dispatchResponse = {
    tasks: [{ type: 'dispatch', payload: [{ find: 'Obi-Wan Kenobi' }] }],
    jobs: [{ find: 'Obi-Wan Kenobi' }],
    results: [{ hello: 'skywalker' }],
  };

  const dispatcher = moxy(async () => dispatchResponse);

  beforeEach(() => {
    dispatcher.mock.reset();
  });

  it('dispatch through middlewares', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });
    await app.start();

    const { dispatchWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      dispatchResponse
    );

    expect(dispatcher).toHaveBeenCalledTimes(1);
    expect(dispatcher).toHaveBeenCalledWith(dispatchFrame);

    for (const middleware of FooPlatform.dispatchMiddlewares) {
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(middleware).toHaveBeenCalledWith(
        dispatchFrame,
        expect.any(Function)
      );
    }
  });

  test('middlewares can modify context and reponse', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });
    await app.start();

    FooPlatform.dispatchMiddlewares[0].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ping: 0 })),
      pong: 0,
    }));
    FooPlatform.dispatchMiddlewares[1].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ding: 1 })),
      dong: 1,
    }));
    FooPlatform.dispatchMiddlewares[2].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ling: 2 })),
      long: 2,
    }));

    const { dispatchWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual({
      ...dispatchResponse,
      pong: 0,
      dong: 1,
      long: 2,
    });

    expect(dispatcher).toHaveBeenCalledTimes(1);
    expect(dispatcher).toHaveBeenCalledWith({
      ...dispatchFrame,
      ping: 0,
      ding: 1,
      ling: 2,
    });
  });

  test('middleware can bypass the finalHandler', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });
    await app.start();

    FooPlatform.dispatchMiddlewares[1].mock.fake(async () => ({
      captured: 'by empire',
    }));

    const { dispatchWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual({
      captured: 'by empire',
    });

    expect(FooPlatform.dispatchMiddlewares[0]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[1]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[2]).not.toHaveBeenCalled();
    expect(dispatcher).not.toHaveBeenCalled();
  });

  test('wrappedHandler throw if middleware throw', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });
    await app.start();

    FooPlatform.dispatchMiddlewares[1].mock.fake(async () => {
      throw new Error('Obi-Wan vanished');
    });

    const { dispatchWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).rejects.toThrow(
      'Obi-Wan vanished'
    );

    expect(FooPlatform.dispatchMiddlewares[0]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[1]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[2]).not.toHaveBeenCalled();
    expect(dispatcher).not.toHaveBeenCalled();
  });

  test('middleware can catch error', async () => {
    dispatcher.mock.fake(async () => {
      throw new Error('death star strike');
    });

    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });
    await app.start();

    const newJobs = [{ get: 'rid of Vadar' }, { blow: 'it up' }];
    const newResponse = {
      tasks: [{ type: 'dispatch', payload: newJobs }],
      jobs: newJobs,
      results: [{ helped: 'by friends' }, { bomb: 'in the port' }],
    };
    FooPlatform.dispatchMiddlewares[0].mock.fake(async (frame, next) => {
      try {
        const response = await next(frame);
        return response;
      } catch (err) {
        return newResponse;
      }
    });

    const { dispatchWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      newResponse
    );

    expect(FooPlatform.dispatchMiddlewares[0]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[1]).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[2]).toHaveBeenCalledTimes(1);
    expect(dispatcher).toHaveBeenCalledTimes(1);
  });

  test('DI within dispatch middleware', async () => {
    const containedMiddleware = moxy((ctx, next) => next(ctx));
    const middlewareContainer = moxy(
      makeContainer({
        deps: [
          FooService,
          BarService,
          TestService,
          AnotherService,
          MyService,
          YourService,
        ],
      })(() => containedMiddleware)
    );

    FooPlatform.mock
      .getter('dispatchMiddlewares')
      .fakeReturnValue([middlewareContainer]);

    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });
    await app.start();

    const { dispatchWrapper } = useTestPlatformUtils.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      dispatchResponse
    );

    expect(middlewareContainer.$$factory).toHaveBeenCalledTimes(1);
    expect(middlewareContainer.$$factory).toHaveBeenCalledWith(
      expect.any(FooService),
      expect.any(BarService),
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedMiddleware).toHaveBeenCalledTimes(1);
    expect(containedMiddleware).toHaveBeenCalledWith(
      dispatchFrame,
      expect.any(Function)
    );

    expect(dispatcher).toHaveBeenCalledTimes(1);
    expect(dispatcher).toHaveBeenCalledWith(dispatchFrame);
  });
});

describe('#useServices(requirements)', () => {
  it('get services by requirement', async () => {
    const app = new App({
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });

    await app.start();

    const NoneService = makeClassProvider({
      lifetime: 'singleton',
    })(class NoneService {});

    expect(
      app.useServices([
        TestService,
        { require: AnotherService, optional: true },
        FooService,
        { require: BarService, optional: true },
        MyService,
        { require: YourService, optional: true },
        { require: NoneService, optional: true },
      ])
    ).toEqual([
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(FooService),
      expect.any(BarService),
      expect.any(MyService),
      expect.any(YourService),
      null,
    ]);

    expect(() =>
      app.useServices([NoneService])
    ).toThrowErrorMatchingInlineSnapshot(`"NoneService is not bound"`);
  });

  it('provide base providers', async () => {
    const app = new App({});
    await app.start();

    const [bot, profiler, marshaler] = app.useServices([
      BaseBotP,
      BaseProfilerP,
      BaseMarshalerP,
    ]);

    expect(bot).toBeInstanceOf(BaseBotP);
    expect(profiler).toBeInstanceOf(BaseProfilerP);
    expect(marshaler).toBeInstanceOf(BaseMarshalerP);
  });
});
