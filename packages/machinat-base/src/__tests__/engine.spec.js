/* eslint-disable no-param-reassign */
import moxy from 'moxy';
import Machinat from 'machinat';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';

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

const segments = [
  { type: 'unit', node: <a id={1} />, value: { id: 1 } },
  { type: 'unit', node: <b id={2} />, value: { id: 2 } },
  { type: 'unit', node: <c id={3} />, value: { id: 3 } },
];

const queue = moxy(new Queue(), {
  excludeProps: ['_waitedRequets', '_queuedJobs'],
});

const worker = moxy({
  start: () => true,
  stop: () => true,
});

const channel = {
  platform: 'test',
  type: 'test',
  uid: 'test',
};

const renderer = moxy(new Renderer('test', {}));

beforeEach(() => {
  queue.executeJobs.mock.reset();
  queue.executeJobs.mock.fake(jobs =>
    Promise.resolve({
      success: true,
      batch: jobs.map(job => ({ job, success: true, result: job.id })),
    })
  );

  renderer.render.mock.reset();
  renderer.render.mock.fakeReturnValue(segments);
});

it('starts worker', () => {
  const engine = new Engine('test', renderer, queue, worker);

  expect(worker.start.mock).toHaveBeenCalledTimes(1);
  expect(worker.start.mock).toHaveBeenCalledWith(engine.queue);
});

describe('#setMiddlewares(...fns)', () => {
  it('throws if non function args given', () => {
    const engine = new Engine('test', renderer, queue, worker);
    const invalidParams = [undefined, null, 1, true, 'foo', {}];

    invalidParams.forEach(p =>
      expect(() => engine.setMiddlewares(p)).toThrow()
    );
  });

  it('returns the engine itself', () => {
    const engine = new Engine('test', renderer, queue, worker);
    expect(engine.setMiddlewares(async () => () => {})).toBe(engine);
  });

  it('adds middleware function to .middlewares', () => {
    const engine = new Engine('test', renderer, queue, worker);

    const middleware1 = async () => {};
    const middleware2 = async () => {};
    const middleware3 = async () => {};

    engine.setMiddlewares(middleware1, middleware2, middleware3);

    expect(engine.middlewares).toEqual([middleware1, middleware2, middleware3]);
  });

  it('reset middlewares every time called', () => {
    const engine = new Engine('test', renderer, queue, worker);

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
    const engine = new Engine('test', renderer, queue, worker);

    expect(engine.setFramePrototype(mixin)).toBe(engine);
  });

  it('extends engine.frame with base props remained', () => {
    const engine = new Engine('test', renderer, queue, worker);

    engine.setFramePrototype(mixin);

    expect(engine.frame.foo).toBe(1);
    expect(engine.frame.bar).toBe(2);
    expect(engine.frame.baz()).toBe(3);
  });

  it('resets frame every time called', () => {
    const engine = new Engine('test', renderer, queue, worker);

    engine.setFramePrototype(mixin);
    engine.setFramePrototype({ hello: 'world' });

    expect(engine.frame.hello).toBe('world');
    expect(engine.frame.foo).toBe(undefined);
    expect(engine.frame.bar).toBe(undefined);
    expect(engine.frame.baz).toBe(undefined);
  });
});

describe('#renderActions(createJobs, target, message, options, allowPause)', () => {
  const createJobs = moxy((_, segemnts) =>
    segemnts.map(({ value: { id } }) => ({ id }))
  );

  beforeEach(() => {
    createJobs.mock.clear();
  });

  it('render message and create "jobs" actions', () => {
    const engine = new Engine('test', renderer, queue, worker);
    expect(
      engine.renderActions(createJobs, 'foo', element, { bar: 1 }, true)
    ).toEqual([{ type: 'jobs', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] }]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, true);

    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith('foo', segments, {
      bar: 1,
    });
  });

  it('pass allowPause to renderer.render', () => {
    const engine = new Engine('test', renderer, queue, worker);
    expect(
      engine.renderActions(createJobs, 'foo', element, { bar: 1 }, false)
    ).toEqual([{ type: 'jobs', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] }]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, false);

    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith('foo', segments, {
      bar: 1,
    });
  });

  it('create "pause" action out of "pause" segments which separate "jobs" action', () => {
    const segmentsWithPause = [
      { type: 'pause', node: <Machinat.Pause />, value: undefined },
      segments[0],
      segments[1],
      { type: 'pause', node: <Machinat.Pause />, value: undefined },
      segments[2],
    ];

    renderer.render.mock.fakeReturnValue(segmentsWithPause);

    const engine = new Engine('test', renderer, queue, worker);
    expect(
      engine.renderActions(createJobs, 'foo', element, { bar: 1 }, true)
    ).toEqual([
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'jobs', payload: [{ id: 1 }, { id: 2 }] },
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'jobs', payload: [{ id: 3 }] },
    ]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, true);

    expect(createJobs.mock).toHaveBeenCalledTimes(2);
    expect(createJobs.mock).toHaveBeenNthCalledWith(
      1,
      'foo',
      segments.slice(0, 2),
      { bar: 1 }
    );
    expect(createJobs.mock).toHaveBeenNthCalledWith(
      2,
      'foo',
      segments.slice(2),
      { bar: 1 }
    );
  });
});

describe('#dispatch(channel, actions, node)', () => {
  it('renders and enqueue jobs and return array of results', async () => {
    const engine = new Engine('test', renderer, queue, worker);
    const actions = [
      { type: 'jobs', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    ];

    await expect(engine.dispatch(channel, actions, element)).resolves.toEqual({
      actions,
      results: [1, 2, 3],
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledWith([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
  });

  it('pass dispatch frame through middlewares', async () => {
    const engine = new Engine('test', renderer, queue, worker);
    const actions = [
      { type: 'jobs', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    ];

    const expectedFrame = {
      platform: 'test',
      channel,
      node: element,
      actions,
    };

    const middleware1 = moxy(next => async frame => {
      expect(frame).toEqual(expectedFrame);
      expect(Object.getPrototypeOf(frame)).toBe(engine.frame);

      frame.foo = 1;
      const response = await next(frame);

      expect(response).toEqual({ actions, results: [1, 2, 3], bar: 2 });
      response.bar = 1;

      return response;
    });

    const middleware2 = moxy(next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: 1 });
      expect(Object.getPrototypeOf(frame)).toBe(engine.frame);

      frame.foo = 2;
      const response = await next(frame);

      expect(response).toEqual({ actions, results: [1, 2, 3], bar: 3 });
      response.bar = 2;

      return response;
    });

    const middleware3 = moxy(next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: 2 });
      expect(Object.getPrototypeOf(frame)).toBe(engine.frame);

      frame.foo = 3;
      const response = await next(frame);

      expect(response).toEqual({ actions, results: [1, 2, 3] });
      response.bar = 3;

      return response;
    });

    engine.setMiddlewares(middleware1, middleware2, middleware3);

    expect(middleware1.mock).toHaveBeenCalledTimes(1);
    expect(middleware2.mock).toHaveBeenCalledTimes(1);
    expect(middleware3.mock).toHaveBeenCalledTimes(1);

    await expect(engine.dispatch(channel, actions, element)).resolves.toEqual({
      bar: 1,
      actions,
      results: [1, 2, 3],
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledWith([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
  });

  it('can bypass the real sending within middleware', async () => {
    const engine = new Engine('test', renderer, queue, worker);
    const actions = [
      { type: 'jobs', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    ];

    const middleware = moxy(() => async () => ({
      actions,
      results: [{ nothing: 'happened' }],
    }));

    engine.setMiddlewares(middleware);

    await expect(engine.dispatch(channel, actions, element)).resolves.toEqual({
      actions,
      results: [{ nothing: 'happened' }],
    });

    expect(middleware.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('can skip following middlewares with error thrown in middleware', async () => {
    const engine = new Engine('test', renderer, queue, worker);

    const middleware = moxy(() => async () => {
      throw new Error('something wrong with the element');
    });

    engine.setMiddlewares(middleware);

    await expect(engine.dispatch(channel, element, options)).rejects.toThrow(
      'something wrong with the element'
    );

    expect(middleware.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('waits pause', async () => {
    const after = moxy(() => Promise.resolve());
    const actionsWithPause = [
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'jobs', payload: [{ id: 1 }, { id: 2 }] },
      { type: 'pause', payload: <Machinat.Pause after={after} /> },
      { type: 'jobs', payload: [{ id: 3 }] },
      { type: 'pause', payload: <Machinat.Pause /> },
    ];

    const engine = new Engine('test', renderer, queue, worker);

    await expect(
      engine.dispatch(channel, actionsWithPause, element)
    ).resolves.toEqual({ actions: actionsWithPause, results: [1, 2, 3] });

    expect(after.mock).toHaveBeenCalledTimes(1);

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
    const actions = [{ type: 'jobs', payload: [1, 2, 3] }];

    queue.executeJobs.mock.fake(() => Promise.resolve(execResponse));

    const engine = new Engine('test', renderer, queue, worker);

    let isThrown = false;
    try {
      await engine.dispatch(channel, actions);
    } catch (err) {
      isThrown = true;
      expect(err.actions).toEqual(actions);
      expect(err.results).toEqual([
        "I'm only one survived",
        undefined,
        undefined,
      ]);

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

    const engine = new Engine('test', renderer, queue, worker);

    const middleware = next => async context => {
      try {
        return await next(context);
      } catch (err) {
        expect(err).toEqual(new Error('bad thing!'));
        return { results: [{ something: 'else' }] };
      }
    };

    engine.setMiddlewares(middleware);

    await expect(
      engine.dispatch(channel, [{ type: 'jobs', payload: [1, 2, 3] }])
    ).resolves.toEqual({ results: [{ something: 'else' }] });
  });
});
