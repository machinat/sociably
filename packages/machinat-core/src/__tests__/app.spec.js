import { factory as moxyFactory } from 'moxy';
import { container, provider, factory, namedInterface } from '../service';
import ServiceScope from '../service/scope';
import App from '../app';

const moxy = moxyFactory({ excludeProps: ['$$deps'] });

const FooService = moxy(
  provider({
    lifetime: 'transient',
  })(class FooService {})
);

const FooModule = moxy({
  provisions: [FooService],
  startHook: container({ deps: [FooService] })(async () => {}),
});

const BarService = moxy(
  provider({
    deps: [FooService],
    lifetime: 'scoped',
  })(class BarService {})
);

const BarModule = moxy({
  provisions: [BarService],
  startHook: container({ deps: [FooService, BarService] })(async () => {}),
});

const TestService = moxy(
  provider({
    deps: [FooService, BarService],
    lifetime: 'singleton',
  })(class TestService {})
);

const TEST_PLATFORM_MOUNTER = namedInterface('TestMounter');
const consumeTestMounter = moxy();
const testMountingFactory = factory({
  deps: [TEST_PLATFORM_MOUNTER],
  lifetime: 'singleton',
})(consumeTestMounter);

const TestPlatform = moxy(
  {
    name: 'foo',
    provisions: [TestService, testMountingFactory],
    mounterInterface: TEST_PLATFORM_MOUNTER,
    startHook: container({
      deps: [FooService, BarService, TestService],
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
  },
  { excludeProps: ['provisions', 'mounterInterface'] }
);

const AnotherService = moxy(
  provider({
    deps: [FooService, BarService],
    lifetime: 'scoped',
  })(class AnotherService {})
);

const ANOTHER_PLATFORM_MOUNTER = namedInterface('AnotherMounter');
const consumeAnotherMounter = moxy();
const anotherMountingFactory = factory({
  deps: [ANOTHER_PLATFORM_MOUNTER],
  lifetime: 'singleton',
})(consumeAnotherMounter);

const AnotherPlatform = moxy(
  {
    name: 'bar',
    mounterInterface: ANOTHER_PLATFORM_MOUNTER,
    provisions: [AnotherService, anotherMountingFactory],
    startHook: container({ deps: [FooService, BarService, AnotherService] })(
      async () => {}
    ),
  },
  { excludeProps: ['provisions', 'mounterInterface'] }
);

const MyService = moxy(
  provider({
    deps: [FooService, BarService, TestService, AnotherService],
    lifetime: 'scoped',
  })(class MyService {})
);

const YourService = moxy(
  provider({
    deps: [FooService, BarService, TestService, AnotherService, MyService],
    lifetime: 'transient',
  })(class YourService {})
);

beforeEach(() => {
  FooService.mock.reset();
  FooModule.mock.reset();
  BarService.mock.reset();
  BarModule.mock.reset();
  TestService.mock.reset();
  TestPlatform.mock.reset();
  AnotherService.mock.reset();
  AnotherPlatform.mock.reset();
  MyService.mock.reset();
  YourService.mock.reset();

  consumeTestMounter.mock.reset();
  consumeAnotherMounter.mock.reset();
});

it('start modules', async () => {
  const app = new App({
    modules: [FooModule, BarModule],
    platforms: [TestPlatform, AnotherPlatform],
    bindings: [MyService, YourService],
  });

  await app.start();

  // trasient service created when boostrap and each time module startHook injected
  expect(FooService.$$factory.mock).toHaveBeenCalledTimes(5);
  expect(FooService.$$factory.mock).toHaveBeenCalledWith(/* empty */);
  expect(FooModule.startHook.mock).toHaveBeenCalledTimes(1);
  expect(FooModule.startHook.mock).toHaveBeenCalledWith(expect.any(FooService));

  // scoped service created when required under boostrap and starting scope
  expect(BarService.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(BarService.$$factory.mock).toHaveBeenCalledWith(
    expect.any(FooService)
  );
  expect(BarModule.startHook.mock).toHaveBeenCalledTimes(1);
  expect(BarModule.startHook.mock).toHaveBeenCalledWith(
    expect.any(FooService),
    expect.any(BarService)
  );

  expect(TestService.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(TestService.$$factory.mock).toHaveBeenCalledWith(
    expect.any(FooService),
    expect.any(BarService)
  );
  expect(TestPlatform.startHook.mock).toHaveBeenCalledTimes(1);
  expect(TestPlatform.startHook.mock).toHaveBeenCalledWith(
    expect.any(FooService),
    expect.any(BarService),
    expect.any(TestService)
  );

  expect(AnotherService.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(AnotherService.$$factory.mock).toHaveBeenCalledWith(
    expect.any(FooService),
    expect.any(BarService)
  );
  expect(AnotherPlatform.startHook.mock).toHaveBeenCalledTimes(1);
  expect(AnotherPlatform.startHook.mock).toHaveBeenCalledWith(
    expect.any(FooService),
    expect.any(BarService),
    expect.any(AnotherService)
  );

  expect(MyService.$$factory.mock).not.toHaveBeenCalled();
  expect(YourService.$$factory.mock).not.toHaveBeenCalled();
});

it('provide mounter utilities by PlatformModule.mounterInterface', async () => {
  const app = new App({
    modules: [FooModule, BarModule],
    platforms: [TestPlatform, AnotherPlatform],
    bindings: [MyService, YourService],
  });

  await app.start();

  expect(consumeTestMounter.mock).toHaveBeenCalledTimes(1);
  expect(consumeTestMounter.mock).toHaveBeenCalledWith({
    initScope: expect.any(Function),
    popError: expect.any(Function),
    popEventWrapper: expect.any(Function),
    dispatchWrapper: expect.any(Function),
  });
  expect(consumeAnotherMounter.mock).toHaveBeenCalledTimes(1);
  expect(consumeAnotherMounter.mock).toHaveBeenCalledWith({
    initScope: expect.any(Function),
    popError: expect.any(Function),
    popEventWrapper: expect.any(Function),
    dispatchWrapper: expect.any(Function),
  });
});

test('mounter.initScope() provide services to platform module', async () => {
  const app = new App({
    modules: [FooModule, BarModule],
    platforms: [TestPlatform, AnotherPlatform],
    bindings: [MyService, YourService],
  });

  await app.start();

  const { initScope } = consumeTestMounter.mock.calls[0].args[0];
  const scope = initScope();
  expect(scope).toBeInstanceOf(ServiceScope);

  expect(
    scope.useServices([
      FooService,
      BarService,
      TestService,
      AnotherService,
      MyService,
      YourService,
    ])
  ).toEqual([
    expect.any(FooService),
    expect.any(BarService),
    expect.any(TestService),
    expect.any(AnotherService),
    expect.any(MyService),
    expect.any(YourService),
  ]);
});

describe('poping event from platform module', () => {
  const eventContext = {
    platform: 'test',
    channel: { phone: 'call' },
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

  test('emit event', async () => {
    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      only: 49.99,
    });

    expect(finalHandler.mock).toHaveBeenCalledTimes(1);
    expect(finalHandler.mock).toHaveBeenCalledWith(eventContext);

    expect(eventListener.mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).toHaveBeenCalledWith(eventContext);
    expect(errorListener.mock).not.toHaveBeenCalled();

    for (const middleware of TestPlatform.eventMiddlewares) {
      expect(middleware.mock).toHaveBeenCalledTimes(1);
      expect(middleware.mock).toHaveBeenCalledWith(
        eventContext,
        expect.any(Function)
      );
    }
  });

  test('middlewares can modify context and reponse', async () => {
    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    TestPlatform.eventMiddlewares[0].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ping: 0 })),
      pong: 0,
    }));
    TestPlatform.eventMiddlewares[1].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ding: 1 })),
      dong: 1,
    }));
    TestPlatform.eventMiddlewares[2].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ling: 2 })),
      long: 2,
    }));

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      only: 49.99,
      pong: 0,
      dong: 1,
      long: 2,
    });

    const modifiedContext = { ...eventContext, ping: 0, ding: 1, ling: 2 };

    expect(finalHandler.mock).toHaveBeenCalledTimes(1);
    expect(finalHandler.mock).toHaveBeenCalledWith(modifiedContext);

    expect(eventListener.mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).toHaveBeenCalledWith(modifiedContext);
    expect(errorListener.mock).not.toHaveBeenCalled();
  });

  test('middleware can bypass the finalHandler', async () => {
    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    TestPlatform.eventMiddlewares[1].mock.fake(async () => ({
      hello: 'and bye!',
    }));

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      hello: 'and bye!',
    });

    expect(TestPlatform.eventMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.eventMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.eventMiddlewares[2].mock).not.toHaveBeenCalled();
    expect(finalHandler.mock).not.toHaveBeenCalled();
    expect(eventListener.mock).not.toHaveBeenCalled();
    expect(errorListener.mock).not.toHaveBeenCalled();
  });

  test('throw and popError if error thrown in middlewares', async () => {
    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    TestPlatform.eventMiddlewares[1].mock.fake(async () => {
      throw new Error("I'll call police!");
    });

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).rejects.toThrow(
      "I'll call police!"
    );

    expect(TestPlatform.eventMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.eventMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.eventMiddlewares[2].mock).not.toHaveBeenCalled();
    expect(finalHandler.mock).not.toHaveBeenCalled();
    expect(eventListener.mock).not.toHaveBeenCalled();
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(
      new Error("I'll call police!")
    );
  });

  test('throw and popError if error thrown in finalHandler', async () => {
    finalHandler.mock.fake(async () => {
      throw new Error('DO~DOO~DOOOO~DO~');
    });

    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).rejects.toThrow(
      'DO~DOO~DOOOO~DO~'
    );

    expect(TestPlatform.eventMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.eventMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.eventMiddlewares[2].mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).not.toHaveBeenCalled();
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(
      new Error('DO~DOO~DOOOO~DO~')
    );
  });

  test('middleware can catch error', async () => {
    finalHandler.mock.fake(async () => {
      throw new Error('DO~DOO~DOOOO~DO~');
    });

    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    TestPlatform.eventMiddlewares[0].mock.fake(async (ctx, next) => {
      try {
        const response = await next(ctx);
        return response;
      } catch (err) {
        return { hello: err.message };
      }
    });

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      hello: 'DO~DOO~DOOOO~DO~',
    });

    expect(TestPlatform.eventMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.eventMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.eventMiddlewares[2].mock).toHaveBeenCalledTimes(1);
    expect(finalHandler.mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).not.toHaveBeenCalled();
    expect(errorListener.mock).not.toHaveBeenCalled();
  });

  test('DI within event listener', async () => {
    const containedListener = moxy();
    const eventListenerContainer = moxy(
      container({
        deps: [
          TestService,
          AnotherService,
          FooService,
          BarService,
          MyService,
          YourService,
        ],
      })(() => containedListener)
    );

    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListenerContainer)
      .onError(errorListener);

    await app.start();
    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await popEventWrapper(finalHandler)(eventContext);

    expect(eventListenerContainer.mock).toHaveBeenCalledTimes(1);
    expect(eventListenerContainer.mock).toHaveBeenCalledWith(
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(FooService),
      expect.any(BarService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedListener.mock).toHaveBeenCalledTimes(1);
    expect(containedListener.mock).toHaveBeenCalledWith(eventContext);
  });

  test('DI within event middleware', async () => {
    const containedMiddleware = moxy((ctx, next) => next(ctx));
    const middlewareContainer = moxy(
      container({
        deps: [
          TestService,
          AnotherService,
          FooService,
          BarService,
          MyService,
          YourService,
        ],
      })(() => containedMiddleware)
    );

    TestPlatform.mock
      .getter('eventMiddlewares')
      .fakeReturnValue([middlewareContainer]);

    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      only: 49.99,
    });

    expect(eventListener.mock).toHaveBeenCalledTimes(1);

    expect(middlewareContainer.mock).toHaveBeenCalledTimes(1);
    expect(middlewareContainer.mock).toHaveBeenCalledWith(
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(FooService),
      expect.any(BarService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedMiddleware.mock).toHaveBeenCalledTimes(1);
    expect(containedMiddleware.mock).toHaveBeenCalledWith(
      eventContext,
      expect.any(Function)
    );
  });
});

describe('poping error from platform module', () => {
  const eventListener = moxy();
  const errorListener = moxy();

  beforeEach(() => {
    eventListener.mock.clear();
    errorListener.mock.clear();
  });

  test('pop error from platform', async () => {
    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popError } = consumeTestMounter.mock.calls[0].args[0];
    expect(popError(new Error("Don't call again!"))).toBe(undefined);

    expect(eventListener.mock).not.toHaveBeenCalled();
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(
      new Error("Don't call again!")
    );
  });

  test('DI within error listener', async () => {
    const containedListener = moxy();
    const errorListnerContainer = moxy(
      container({
        deps: [
          TestService,
          AnotherService,
          FooService,
          BarService,
          MyService,
          YourService,
        ],
      })(() => containedListener)
    );

    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListnerContainer);

    await app.start();

    const { popError } = consumeTestMounter.mock.calls[0].args[0];
    popError(new Error('hello container'));

    expect(errorListnerContainer.mock).toHaveBeenCalledTimes(1);
    expect(errorListnerContainer.mock).toHaveBeenCalledWith(
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(FooService),
      expect.any(BarService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedListener.mock).toHaveBeenCalledTimes(1);
    expect(containedListener.mock).toHaveBeenCalledWith(
      new Error('hello container')
    );
  });
});

describe('dispatch through middlewares', () => {
  const dispatchFrame = {
    platform: 'test',
    channel: { a: 'new hope' },
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
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    });
    await app.start();

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      dispatchResponse
    );

    expect(dispatcher.mock).toHaveBeenCalledTimes(1);
    expect(dispatcher.mock).toHaveBeenCalledWith(dispatchFrame);

    for (const middleware of TestPlatform.dispatchMiddlewares) {
      expect(middleware.mock).toHaveBeenCalledTimes(1);
      expect(middleware.mock).toHaveBeenCalledWith(
        dispatchFrame,
        expect.any(Function)
      );
    }
  });

  test('middlewares can modify context and reponse', async () => {
    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    });
    await app.start();

    TestPlatform.dispatchMiddlewares[0].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ping: 0 })),
      pong: 0,
    }));
    TestPlatform.dispatchMiddlewares[1].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ding: 1 })),
      dong: 1,
    }));
    TestPlatform.dispatchMiddlewares[2].mock.fake(async (ctx, next) => ({
      ...(await next({ ...ctx, ling: 2 })),
      long: 2,
    }));

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual({
      ...dispatchResponse,
      pong: 0,
      dong: 1,
      long: 2,
    });

    expect(dispatcher.mock).toHaveBeenCalledTimes(1);
    expect(dispatcher.mock).toHaveBeenCalledWith({
      ...dispatchFrame,
      ping: 0,
      ding: 1,
      ling: 2,
    });
  });

  test('middleware can bypass the finalHandler', async () => {
    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    });
    await app.start();

    TestPlatform.dispatchMiddlewares[1].mock.fake(async () => ({
      captured: 'by empire',
    }));

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual({
      captured: 'by empire',
    });

    expect(TestPlatform.dispatchMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.dispatchMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.dispatchMiddlewares[2].mock).not.toHaveBeenCalled();
    expect(dispatcher.mock).not.toHaveBeenCalled();
  });

  test('wrappedHandler throw if middleware throw', async () => {
    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    });
    await app.start();

    TestPlatform.dispatchMiddlewares[1].mock.fake(async () => {
      throw new Error('Obi-Wan vanished');
    });

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).rejects.toThrow(
      'Obi-Wan vanished'
    );

    expect(TestPlatform.dispatchMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.dispatchMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.dispatchMiddlewares[2].mock).not.toHaveBeenCalled();
    expect(dispatcher.mock).not.toHaveBeenCalled();
  });

  test('middleware can catch error', async () => {
    dispatcher.mock.fake(async () => {
      throw new Error('death star strike');
    });

    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    });
    await app.start();

    const newJobs = [{ get: 'rid of Vadar' }, { blow: 'it up' }];
    const newResponse = {
      tasks: [{ type: 'dispatch', payload: newJobs }],
      jobs: newJobs,
      results: [{ helped: 'by friends' }, { bomb: 'in the port' }],
    };
    TestPlatform.dispatchMiddlewares[0].mock.fake(async (frame, next) => {
      try {
        const response = await next(frame);
        return response;
      } catch (err) {
        return newResponse;
      }
    });

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      newResponse
    );

    expect(TestPlatform.dispatchMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.dispatchMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(TestPlatform.dispatchMiddlewares[2].mock).toHaveBeenCalledTimes(1);
    expect(dispatcher.mock).toHaveBeenCalledTimes(1);
  });

  test('DI within dispatch middleware', async () => {
    const containedMiddleware = moxy((ctx, next) => next(ctx));
    const middlewareContainer = moxy(
      container({
        deps: [
          TestService,
          AnotherService,
          FooService,
          BarService,
          MyService,
          YourService,
        ],
      })(() => containedMiddleware)
    );

    TestPlatform.mock
      .getter('dispatchMiddlewares')
      .fakeReturnValue([middlewareContainer]);

    const app = new App({
      modules: [FooModule, BarModule],
      platforms: [TestPlatform, AnotherPlatform],
      bindings: [MyService, YourService],
    });
    await app.start();

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      dispatchResponse
    );

    expect(middlewareContainer.mock).toHaveBeenCalledTimes(1);
    expect(middlewareContainer.mock).toHaveBeenCalledWith(
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(FooService),
      expect.any(BarService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedMiddleware.mock).toHaveBeenCalledTimes(1);
    expect(containedMiddleware.mock).toHaveBeenCalledWith(
      dispatchFrame,
      expect.any(Function)
    );

    expect(dispatcher.mock).toHaveBeenCalledTimes(1);
    expect(dispatcher.mock).toHaveBeenCalledWith(dispatchFrame);
  });
});

test('#useServices(requirements)', async () => {
  const app = new App({
    modules: [FooModule, BarModule],
    platforms: [TestPlatform, AnotherPlatform],
    bindings: [MyService, YourService],
  });

  await app.start();

  const NoneService = provider({ lifetime: 'singleton', factory: () => 'NO' })(
    function NoneService() {}
  );

  expect(
    app.useServices([
      FooService,
      { require: BarService, optional: true },
      TestService,
      { require: AnotherService, optional: true },
      MyService,
      { require: YourService, optional: true },
      { require: NoneService, optional: true },
    ])
  ).toEqual([
    expect.any(FooService),
    expect.any(BarService),
    expect.any(TestService),
    expect.any(AnotherService),
    expect.any(MyService),
    expect.any(YourService),
    null,
  ]);

  expect(() =>
    app.useServices([NoneService])
  ).toThrowErrorMatchingInlineSnapshot(`"NoneService is not bound"`);
});
