/* eslint-disable no-param-reassign */
import moxy from 'moxy';
import Machinat from 'machinat';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';
import { MACHINAT_ACTION_BREAK } from 'machinat-symbol';

import Engine from '../engine';
import DispatchError from '../error';

const element = (
  <>
    <a id={1} />
    <b id={2} />
    <c id={3} />
  </>
);
const options = { foo: 'bar' };

const actions = [
  {
    isPause: false,
    element: <a id={1} />,
    value: '__RENDERED_GENERAL_1__',
    path: '$::0',
  },
  {
    isPause: false,
    element: <b id={2} />,
    value: '__RENDERED_GENERAL_2__',
    path: '$::1',
  },
  {
    isPause: false,
    element: <c id={3} />,
    value: '__RENDERED_GENERAL_3__',
    path: '$::2',
  },
];

const queue = moxy(new Queue(), {
  excludeProps: ['_waitedRequets', '_queuedJobs'],
});

const thread = moxy({
  platform: 'test',
  type: 'test',
  allowPause: true,
  uid: () => 'TEST',
  createJobs: acts => acts.map(act => ({ id: act.element.props.id })),
});

const renderer = moxy(new Renderer('test', {}));

beforeEach(() => {
  thread.mock.reset();

  queue.executeJobs.mock.reset();
  queue.executeJobs.mock.fake(jobs =>
    Promise.resolve({
      success: true,
      batch: jobs.map(job => ({ job, success: true, result: job.id })),
    })
  );

  renderer.render.mock.reset();
  renderer.render.mock.fakeReturnValue(actions);
});

describe('#setMiddlewares(...fns)', () => {
  it('throws if non function args given', () => {
    const engine = new Engine('test', queue, renderer);
    const invalidParams = [undefined, null, 1, true, 'foo', {}];

    invalidParams.forEach(p =>
      expect(() => engine.setMiddlewares(p)).toThrow()
    );
  });

  it('returns the engine itself', () => {
    const engine = new Engine('test', queue, renderer);
    expect(engine.setMiddlewares(async () => () => {})).toBe(engine);
  });

  it('adds middleware function to .middlewares', () => {
    const engine = new Engine('test', queue, renderer);

    const middleware1 = async () => {};
    const middleware2 = async () => {};
    const middleware3 = async () => {};

    engine.setMiddlewares(middleware1, middleware2, middleware3);

    expect(engine.middlewares).toEqual([middleware1, middleware2, middleware3]);
  });

  it('reset middlewares every time called', () => {
    const engine = new Engine('test', queue, renderer);

    const middleware1 = async () => {};
    const middleware2 = async () => {};
    const middleware3 = async () => {};

    engine.setMiddlewares(middleware1, middleware2);
    expect(engine.middlewares).toEqual([middleware1, middleware2]);

    engine.setMiddlewares(middleware3, middleware2);
    expect(engine.middlewares).toEqual([middleware3, middleware2]);
  });
});

describe('#setFramePrototype(mixin)', () => {
  const mixin = {
    foo: 1,
    get bar() {
      return 2;
    },
    baz() {
      return 3;
    },
  };

  it('return engine itself', () => {
    const engine = new Engine('test', queue, renderer);

    expect(engine.setFramePrototype(mixin)).toBe(engine);
  });

  it('extends engine.frame with base props remained', () => {
    const engine = new Engine('test', queue, renderer);

    engine.setFramePrototype(mixin);

    expect(typeof engine.frame.createJobs).toBe('function');

    expect(engine.frame.foo).toBe(1);
    expect(engine.frame.bar).toBe(2);
    expect(engine.frame.baz()).toBe(3);
  });

  it('resets frame every time called', () => {
    const engine = new Engine('test', queue, renderer);

    engine.setFramePrototype(mixin);
    engine.setFramePrototype({ hello: 'world' });

    expect(engine.frame.hello).toBe('world');
    expect(engine.frame.foo).toBe(undefined);
    expect(engine.frame.bar).toBe(undefined);
    expect(engine.frame.baz).toBe(undefined);
  });
});

describe('#dispatch(thread, element, options)', () => {
  it('renders and enqueue jobs and return array of results', async () => {
    const engine = new Engine('test', queue, renderer);

    await expect(engine.dispatch(thread, element, options)).resolves.toEqual([
      1,
      2,
      3,
    ]);

    expect(renderer.render.mock).toHaveBeenCalledWith(element, {
      platform: 'test',
    });

    expect(thread.createJobs.mock).toHaveBeenCalledWith(actions, options);

    expect(queue.executeJobs.mock).toHaveBeenCalledWith([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
  });

  it('pass dispatch frame through middlewares', async () => {
    const engine = new Engine('test', queue, renderer);

    const expectedFrame = {
      platform: 'test',
      thread,
      options,
      renderer,
      element,
      actions,
    };

    const expectedResponse = {
      element,
      actions,
      jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
      results: [1, 2, 3],
    };

    const middleware1 = moxy(next => async frame => {
      expect(frame).toEqual(expectedFrame);
      expect(Object.getPrototypeOf(frame)).toBe(engine.frame);

      frame.foo = 1;
      const result = await next(frame);

      expect(result).toEqual({ ...expectedResponse, bar: 2 });
      result.bar = 1;

      return result;
    });

    const middleware2 = moxy(next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: 1 });
      expect(Object.getPrototypeOf(frame)).toBe(engine.frame);

      frame.foo = 2;
      const result = await next(frame);

      expect(result).toEqual({ ...expectedResponse, bar: 3 });
      result.bar = 2;

      return result;
    });

    const middleware3 = moxy(next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: 2 });
      expect(Object.getPrototypeOf(frame)).toBe(engine.frame);

      frame.foo = 3;
      const result = await next(frame);

      expect(result).toEqual(expectedResponse);
      result.bar = 3;

      return result;
    });

    engine.setMiddlewares(middleware1, middleware2, middleware3);

    expect(middleware1.mock).toHaveBeenCalledTimes(1);
    expect(middleware2.mock).toHaveBeenCalledTimes(1);
    expect(middleware3.mock).toHaveBeenCalledTimes(1);

    await expect(engine.dispatch(thread, element, options)).resolves.toEqual([
      1,
      2,
      3,
    ]);

    expect(renderer.render.mock).toHaveBeenCalledWith(element, {
      platform: 'test',
    });

    expect(thread.createJobs.mock).toHaveBeenCalledWith(actions, options);

    expect(queue.executeJobs.mock).toHaveBeenCalledWith([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
  });

  it('can bypass the real sending within middleware', async () => {
    const engine = new Engine('test', queue, renderer);

    const middleware = moxy(() => async () => ({
      results: [{ nothing: 'happened' }],
    }));

    engine.setMiddlewares(middleware);

    await expect(engine.dispatch(thread, element, options)).resolves.toEqual([
      { nothing: 'happened' },
    ]);

    expect(renderer.render.mock).toHaveBeenCalledWith(element, {
      platform: 'test',
    });

    expect(middleware.mock).toHaveBeenCalledTimes(1);
    expect(thread.createJobs.mock).not.toHaveBeenCalled();
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('can skip following middlewares with error thrown in middleware', async () => {
    const engine = new Engine('test', queue, renderer);

    const middleware = moxy(() => async () => {
      throw new Error('something wrong with the element');
    });

    engine.setMiddlewares(middleware);

    await expect(engine.dispatch(thread, element, options)).rejects.toThrow(
      'something wrong with the element'
    );

    expect(renderer.render.mock).toHaveBeenCalledWith(element, {
      platform: 'test',
    });

    expect(middleware.mock).toHaveBeenCalledTimes(1);
    expect(thread.createJobs.mock).not.toHaveBeenCalled();
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('waits pause', async () => {
    const after = moxy(() => Promise.resolve());
    const pausedActions = [
      {
        isPause: false,
        element: <a id={1} />,
        value: '__RENDERED_GENERAL_1__',
        path: '$::0',
      },
      {
        isPause: true,
        element: <Machinat.Pause />,
        path: '$::1',
      },
      {
        isPause: false,
        element: <b id={2} />,
        value: '__RENDERED_GENERAL_2__',
        path: '$::2',
      },
      {
        isPause: true,
        element: <Machinat.Pause after={after} />,
        path: '$::3',
      },
      {
        isPause: false,
        element: <b id={3} />,
        value: '__RENDERED_GENERAL_3__',
        path: '$::4',
      },
    ];
    renderer.render.mock.fakeReturnValue(pausedActions);

    const engine = new Engine('test', queue, renderer);

    await expect(engine.dispatch(thread, element, options)).resolves.toEqual([
      1,
      2,
      3,
    ]);

    expect(after.mock).toHaveBeenCalledTimes(1);

    expect(renderer.render.mock).toHaveBeenCalledWith(element, {
      platform: 'test',
    });

    expect(thread.createJobs.mock).toHaveBeenNthCalledWith(
      1,
      [pausedActions[0]],
      options
    );
    expect(thread.createJobs.mock).toHaveBeenNthCalledWith(
      2,
      [pausedActions[2]],
      options
    );
    expect(thread.createJobs.mock).toHaveBeenNthCalledWith(
      3,
      [pausedActions[4]],
      options
    );

    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(1, [{ id: 1 }]);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(2, [{ id: 2 }]);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(3, [{ id: 3 }]);
  });

  it('throw when pause met if thread not allowPause', async () => {
    const pausedActions = [
      {
        isPause: false,
        element: <a id={1} />,
        value: '__RENDERED_GENERAL_1__',
        path: '$::0',
      },
      {
        isPause: true,
        element: <Machinat.Pause />,
        path: '$::1',
      },
      {
        isPause: false,
        element: <b id={2} />,
        value: '__RENDERED_GENERAL_2__',
        path: '$::2',
      },
    ];
    renderer.render.mock.fakeReturnValue(pausedActions);

    thread.mock.getter('allowPause').fakeReturnValue(false);
    const engine = new Engine('test', queue, renderer);

    await expect(
      engine.dispatch(thread, element, options)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"you shall not <Pause /> on test:test"`
    );

    expect(renderer.render.mock).toHaveBeenCalledWith(element, {
      platform: 'test',
    });

    expect(thread.createJobs.mock).toHaveBeenCalledTimes(1);
    expect(thread.createJobs.mock).toHaveBeenCalledWith(
      [pausedActions[0]],
      options
    );

    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('ignores break', async () => {
    const pausedActions = [
      {
        isPause: false,
        element: <a id={1} />,
        value: '__RENDERED_GENERAL_1__',
        path: '$::0',
      },
      {
        isPause: false,
        element: <br />,
        value: MACHINAT_ACTION_BREAK,
        path: '$::1',
      },
      {
        isPause: false,
        element: <a id={2} />,
        value: '__RENDERED_GENERAL_2__',
        path: '$::2',
      },
      {
        isPause: true,
        element: <Machinat.Pause />,
        path: '$::3',
      },
      {
        isPause: false,
        element: <br />,
        value: MACHINAT_ACTION_BREAK,
        path: '$::4',
      },
      {
        isPause: false,
        element: <a id={3} />,
        value: '__RENDERED_GENERAL_3__',
        path: '$::5',
      },
      {
        isPause: false,
        element: <br />,
        value: MACHINAT_ACTION_BREAK,
        path: '$::6',
      },
    ];
    renderer.render.mock.fakeReturnValue(pausedActions);

    const engine = new Engine('test', queue, renderer);

    await expect(engine.dispatch(thread, element, options)).resolves.toEqual([
      1,
      2,
      3,
    ]);

    expect(renderer.render.mock).toHaveBeenCalledWith(element, {
      platform: 'test',
    });

    expect(thread.createJobs.mock).toHaveBeenNthCalledWith(
      1,
      [pausedActions[0], pausedActions[2]],
      options
    );
    expect(thread.createJobs.mock).toHaveBeenNthCalledWith(
      2,
      [pausedActions[5]],
      options
    );

    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(1, [
      { id: 1 },
      { id: 2 },
    ]);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(2, [{ id: 3 }]);
  });

  it('throws if execution fail', async () => {
    const err1 = new Error('bad thing 1');
    const err2 = new Error('bad thing 2');
    const execResponse = {
      success: false,
      errors: [err1, err2],
      batch: [
        { success: true, job: { id: 1 }, result: "I'm only one survived" },
        undefined,
        undefined,
      ],
    };

    queue.executeJobs.mock.fake(() => Promise.resolve(execResponse));

    const engine = new Engine('test', queue, renderer);

    let isThrown = false;
    try {
      await engine.dispatch(thread, element);
    } catch (err) {
      isThrown = true;
      expect(err.node).toEqual(element);
      expect(err.actions).toEqual(actions);
      expect(err.jobs).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(err.responses).toEqual(execResponse.batch);

      expect(err).toBeInstanceOf(DispatchError);

      expect(err.message).toEqual(expect.stringContaining(err1.message));
      expect(err.message).toEqual(expect.stringContaining(err2.message));

      expect(err.message).toMatchInlineSnapshot(`
"Errors happen while sending:
	1) Error: bad thing 1
	2) Error: bad thing 2"
`);
    } finally {
      expect(isThrown).toBe(true);
    }
  });

  it('can catch sending error in middleware', async () => {
    queue.executeJobs.mock.fake(() => Promise.reject(new Error('bad thing!')));

    const engine = new Engine('test', queue, renderer);

    const middleware = next => async context => {
      try {
        return await next(context);
      } catch (err) {
        expect(err).toEqual(new Error('bad thing!'));
        return { results: [{ something: 'else' }] };
      }
    };

    engine.setMiddlewares(middleware);

    await expect(engine.dispatch(thread, element)).resolves.toEqual([
      { something: 'else' },
    ]);
  });
});
