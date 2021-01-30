import { factory as moxyFactory } from '@moxyjs/moxy';
import {
  makeContainer,
  makeClassProvider,
  makeFactoryProvider,
  makeInterface,
} from '../service';
import { BaseBot, BaseProfiler } from '../base';
import ServiceScope from '../service/scope';
import App from '../app';

const moxy = moxyFactory({
  includeProperties: ['*'],
  excludeProperties: ['$$deps', 'provisions', 'mounterInterface'],
});

const TestService = moxy(
  makeClassProvider({
    lifetime: 'transient',
  })(class TestService {})
);

const TestModule = moxy({
  provisions: [TestService],
  startHook: makeContainer({ deps: [TestService] })(async () => {}),
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
});

const FooService = moxy(
  makeClassProvider({
    deps: [TestService, AnotherService],
    lifetime: 'singleton',
  })(class FooService {})
);

const TEST_PLATFORM_MOUNTER = makeInterface({ name: 'TestMounter' });
const consumeTestMounter = moxy();
const testMountingFactory = makeFactoryProvider({
  deps: [TEST_PLATFORM_MOUNTER],
  lifetime: 'singleton',
})(consumeTestMounter);

const FooPlatform = moxy({
  name: 'foo',
  provisions: [FooService, testMountingFactory],
  mounterInterface: TEST_PLATFORM_MOUNTER,
  startHook: makeContainer({
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
} as any);

const BarService = moxy(
  makeClassProvider({
    deps: [TestService, AnotherService],
    lifetime: 'scoped',
  })(class BarService {})
);

const ANOTHER_PLATFORM_MOUNTER = makeInterface({ name: 'AnotherMounter' });
const consumeAnotherMounter = moxy();
const anotherMountingFactory = makeFactoryProvider({
  deps: [ANOTHER_PLATFORM_MOUNTER],
  lifetime: 'singleton',
})(consumeAnotherMounter);

const BarPlatform = moxy({
  name: 'bar',
  mounterInterface: ANOTHER_PLATFORM_MOUNTER,
  provisions: [BarService, anotherMountingFactory],
  startHook: makeContainer({
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

  consumeTestMounter.mock.reset();
  consumeAnotherMounter.mock.reset();
});

it('start modules', async () => {
  const app = new App({
    modules: [TestModule, AnotherModule],
    platforms: [FooPlatform, BarPlatform],
    services: [MyService, YourService],
  });

  await app.start();

  // trasient service created when boostrap and each time module startHook injected
  expect(TestService.$$factory.mock).toHaveBeenCalledTimes(5);
  expect(TestService.$$factory.mock).toHaveBeenCalledWith(/* empty */);
  expect(TestModule.startHook.mock).toHaveBeenCalledTimes(1);
  expect(TestModule.startHook.mock).toHaveBeenCalledWith(
    expect.any(TestService)
  );

  expect(AnotherService.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(AnotherService.$$factory.mock).toHaveBeenCalledWith(
    expect.any(TestService)
  );
  expect(AnotherModule.startHook.mock).toHaveBeenCalledTimes(1);
  expect(AnotherModule.startHook.mock).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService)
  );

  expect(FooService.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(FooService.$$factory.mock).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService)
  );
  expect(FooPlatform.startHook.mock).toHaveBeenCalledTimes(1);
  expect(FooPlatform.startHook.mock).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService),
    expect.any(FooService)
  );

  expect(BarService.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BarService.$$factory.mock).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService)
  );
  expect(BarPlatform.startHook.mock).toHaveBeenCalledTimes(1);
  expect(BarPlatform.startHook.mock).toHaveBeenCalledWith(
    expect.any(TestService),
    expect.any(AnotherService),
    expect.any(BarService)
  );

  expect(MyService.$$factory.mock).not.toHaveBeenCalled();
  expect(YourService.$$factory.mock).not.toHaveBeenCalled();
});

it('provide mounter utilities by PlatformModule.mounterInterface', async () => {
  const app = new App({
    modules: [TestModule, AnotherModule],
    platforms: [FooPlatform, BarPlatform],
    services: [MyService, YourService],
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
    modules: [TestModule, AnotherModule],
    platforms: [FooPlatform, BarPlatform],
    services: [MyService, YourService],
  });

  await app.start();

  const { initScope } = consumeTestMounter.mock.calls[0].args[0];
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
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
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

    for (const middleware of FooPlatform.eventMiddlewares) {
      expect(middleware.mock).toHaveBeenCalledTimes(1);
      expect(middleware.mock).toHaveBeenCalledWith(
        eventContext,
        expect.any(Function)
      );
    }
  });

  test('middlewares can modify context and reponse', async () => {
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

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      hello: 'and bye!',
    });

    expect(FooPlatform.eventMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[2].mock).not.toHaveBeenCalled();
    expect(finalHandler.mock).not.toHaveBeenCalled();
    expect(eventListener.mock).not.toHaveBeenCalled();
    expect(errorListener.mock).not.toHaveBeenCalled();
  });

  test('throw and popError if error thrown in middlewares', async () => {
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

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).rejects.toThrow(
      "I'll call police!"
    );

    expect(FooPlatform.eventMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[2].mock).not.toHaveBeenCalled();
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
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    })
      .onEvent(eventListener)
      .onError(errorListener);

    await app.start();

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).rejects.toThrow(
      'DO~DOO~DOOOO~DO~'
    );

    expect(FooPlatform.eventMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[2].mock).toHaveBeenCalledTimes(1);
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

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      hello: 'DO~DOO~DOOOO~DO~',
    });

    expect(FooPlatform.eventMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.eventMiddlewares[2].mock).toHaveBeenCalledTimes(1);
    expect(finalHandler.mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).not.toHaveBeenCalled();
    expect(errorListener.mock).not.toHaveBeenCalled();
  });

  test('DI within event listener', async () => {
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
    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await popEventWrapper(finalHandler)(eventContext);

    expect(eventListenerContainer.mock).toHaveBeenCalledTimes(1);
    expect(eventListenerContainer.mock).toHaveBeenCalledWith(
      expect.any(FooService),
      expect.any(BarService),
      expect.any(TestService),
      expect.any(AnotherService),
      expect.any(MyService),
      expect.any(YourService)
    );

    expect(containedListener.mock).toHaveBeenCalledTimes(1);
    expect(containedListener.mock).toHaveBeenCalledWith(eventContext);
  });

  test('DI within event middleware', async () => {
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

    const { popEventWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(popEventWrapper(finalHandler)(eventContext)).resolves.toEqual({
      only: 49.99,
    });

    expect(eventListener.mock).toHaveBeenCalledTimes(1);

    expect(middlewareContainer.mock).toHaveBeenCalledTimes(1);
    expect(middlewareContainer.mock).toHaveBeenCalledWith(
      expect.any(FooService),
      expect.any(BarService),
      expect.any(TestService),
      expect.any(AnotherService),
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
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
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

    const { popError } = consumeTestMounter.mock.calls[0].args[0];
    popError(new Error('hello container'));

    expect(errorListnerContainer.mock).toHaveBeenCalledTimes(1);
    expect(errorListnerContainer.mock).toHaveBeenCalledWith(
      expect.any(FooService),
      expect.any(BarService),
      expect.any(TestService),
      expect.any(AnotherService),
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
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });
    await app.start();

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      dispatchResponse
    );

    expect(dispatcher.mock).toHaveBeenCalledTimes(1);
    expect(dispatcher.mock).toHaveBeenCalledWith(dispatchFrame);

    for (const middleware of FooPlatform.dispatchMiddlewares) {
      expect(middleware.mock).toHaveBeenCalledTimes(1);
      expect(middleware.mock).toHaveBeenCalledWith(
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
      modules: [TestModule, AnotherModule],
      platforms: [FooPlatform, BarPlatform],
      services: [MyService, YourService],
    });
    await app.start();

    FooPlatform.dispatchMiddlewares[1].mock.fake(async () => ({
      captured: 'by empire',
    }));

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual({
      captured: 'by empire',
    });

    expect(FooPlatform.dispatchMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[2].mock).not.toHaveBeenCalled();
    expect(dispatcher.mock).not.toHaveBeenCalled();
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

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).rejects.toThrow(
      'Obi-Wan vanished'
    );

    expect(FooPlatform.dispatchMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[2].mock).not.toHaveBeenCalled();
    expect(dispatcher.mock).not.toHaveBeenCalled();
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

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      newResponse
    );

    expect(FooPlatform.dispatchMiddlewares[0].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[1].mock).toHaveBeenCalledTimes(1);
    expect(FooPlatform.dispatchMiddlewares[2].mock).toHaveBeenCalledTimes(1);
    expect(dispatcher.mock).toHaveBeenCalledTimes(1);
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

    const { dispatchWrapper } = consumeTestMounter.mock.calls[0].args[0];

    await expect(dispatchWrapper(dispatcher)(dispatchFrame)).resolves.toEqual(
      dispatchResponse
    );

    expect(middlewareContainer.mock).toHaveBeenCalledTimes(1);
    expect(middlewareContainer.mock).toHaveBeenCalledWith(
      expect.any(FooService),
      expect.any(BarService),
      expect.any(TestService),
      expect.any(AnotherService),
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
      factory: () => 'NO',
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

  it('provide BaseBot and BaseProfiler by default', async () => {
    const app = new App({});
    await app.start();

    const [bot, profiler] = app.useServices([BaseBot, BaseProfiler]);

    expect(bot).toBeInstanceOf(BaseBot);
    expect(profiler).toBeInstanceOf(BaseProfiler);
  });
});
