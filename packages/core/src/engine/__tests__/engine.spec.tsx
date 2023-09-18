/* eslint-disable no-param-reassign */
import moxy, { Mock } from '@moxyjs/moxy';
import Sociably from '../../index.js';
import Engine from '../engine.js';
import RenderingTargetI from '../../base/RenderingTarget.js';
import type Render from '../../renderer/index.js';
import type Queue from '../../queue/index.js';
import { ServiceScope, createEmptyScope } from '../../service/index.js';
import DispatchError from '../error.js';

const queue = moxy<Queue<unknown, unknown>>({
  executeJobs(jobs) {
    return Promise.resolve({
      success: true,
      batch: jobs.map((job) => ({
        job,
        success: true,
        result: `result#${job.id}`,
      })),
    });
  },
} as never);

const worker = moxy({
  start: () => true,
  stop: () => true,
});

const renderer = moxy<Render<unknown, any>>({ render: () => null } as never);

const scope = moxy(createEmptyScope());
const initScope = moxy(() => scope);

const wrappedDispatchMock = new Mock();
const dispatchWrapper = moxy((dispatcher) =>
  wrappedDispatchMock.proxify((frame) => dispatcher(frame)),
);

beforeEach(() => {
  renderer.mock.reset();
  worker.mock.reset();
  queue.mock.reset();

  initScope.mock.reset();
  wrappedDispatchMock.reset();
  dispatchWrapper.mock.reset();
});

test('.constructor(...) ok', () => {
  const engine = new Engine(
    'test',
    renderer,
    queue,
    worker,
    initScope,
    dispatchWrapper,
  );

  expect(engine.platform).toBe('test');
  expect(engine.renderer).toBe(renderer);
  expect(engine.queue).toBe(queue);
  expect(engine.worker).toBe(worker);
});

test('.start() and #stop()', () => {
  const engine = new Engine(
    'test',
    renderer,
    queue,
    worker,
    initScope,
    dispatchWrapper,
  );

  expect(worker.start).not.toHaveBeenCalled();

  expect(engine.start()).toBe(undefined);
  expect(worker.start).toHaveBeenCalledTimes(1);
  expect(worker.start).toHaveBeenCalledWith(queue);

  expect(engine.stop()).toBe(undefined);
  expect(worker.stop).toHaveBeenCalledTimes(1);
  expect(worker.stop).toHaveBeenCalledWith(queue);
});

describe('.render(target, node, createJobs)', () => {
  const dispatchTarget = {
    platform: 'test',
    type: 'test',
    uid: 'test',
  };

  const message = (
    <>
      <a id={1} />
      <b id={2} />
      <c id={3} />
    </>
  );

  const unitSegments = [
    { type: 'unit', node: <a id={1} />, value: { id: 1 } },
    { type: 'unit', node: <b id={2} />, value: { id: 2 } },
    { type: 'unit', node: <c id={3} />, value: { id: 3 } },
    { type: 'unit', node: <c id={4} />, value: { id: 4 } },
  ];

  const createJobs = moxy((target, segemnts) =>
    segemnts.map(({ value: { id } }) => ({ id })),
  );

  const engine = new Engine(
    'test',
    renderer,
    queue,
    worker,
    initScope,
    dispatchWrapper,
  );

  beforeEach(() => {
    renderer.render.mock.fakeReturnValue(unitSegments);
    createJobs.mock.reset();
  });

  test('render empty', async () => {
    renderer.render.mock.fake(() => Promise.resolve(null));

    await expect(
      engine.render(dispatchTarget, message, createJobs),
    ).resolves.toBe(null);

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(message, scope, [
      [RenderingTargetI, dispatchTarget],
    ]);

    expect(createJobs).not.toHaveBeenCalled();
    expect(wrappedDispatchMock).not.toHaveBeenCalled();
    expect(queue.executeJobs).not.toHaveBeenCalled();
  });

  it('render messages and then dispatch jobs', async () => {
    const expectedJobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const expectedResults = ['result#1', 'result#2', 'result#3', 'result#4'];
    const expectedTasks = [{ type: 'dispatch', payload: expectedJobs }];

    await expect(
      engine.render(dispatchTarget, message, createJobs),
    ).resolves.toEqual({
      jobs: expectedJobs,
      results: expectedResults,
      tasks: expectedTasks,
    });

    expect(initScope).toHaveBeenCalledTimes(1);

    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(message, scope, [
      [RenderingTargetI, dispatchTarget],
    ]);

    expect(createJobs).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledWith(dispatchTarget, unitSegments);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target: dispatchTarget,
        node: message,
        tasks: expectedTasks,
      },
      scope,
    );

    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledWith(expectedJobs);
  });

  test('separate "dispatch" jobs with "pause"', async () => {
    const delayFn = moxy(async () => {});
    const segmentsWithPauses = [
      {
        type: 'pause',
        node: <Sociably.Pause delay={delayFn} />,
        value: delayFn,
      },
      unitSegments[0],
      { type: 'pause', node: <Sociably.Pause />, value: null },
      unitSegments[1],
      unitSegments[2],
      {
        type: 'pause',
        node: <Sociably.Pause delay={delayFn} />,
        value: delayFn,
      },
      unitSegments[3],
    ];

    renderer.render.mock.fakeReturnValue(segmentsWithPauses);

    const expectedJobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const expectedResults = ['result#1', 'result#2', 'result#3', 'result#4'];
    const expectedTasks = [
      { type: 'pause', payload: delayFn },
      { type: 'dispatch', payload: [{ id: 1 }] },
      { type: 'pause', payload: null },
      { type: 'dispatch', payload: [{ id: 2 }, { id: 3 }] },
      { type: 'pause', payload: delayFn },
      { type: 'dispatch', payload: [{ id: 4 }] },
    ];

    await expect(
      engine.render(dispatchTarget, message, createJobs),
    ).resolves.toEqual({
      jobs: expectedJobs,
      results: expectedResults,
      tasks: expectedTasks,
    });

    expect(initScope).toHaveBeenCalledTimes(1);

    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(message, scope, [
      [RenderingTargetI, dispatchTarget],
    ]);

    expect(createJobs).toHaveBeenCalledTimes(3);
    expect(createJobs).toHaveBeenNthCalledWith(1, dispatchTarget, [
      unitSegments[0],
    ]);
    expect(createJobs).toHaveBeenNthCalledWith(2, dispatchTarget, [
      unitSegments[1],
      unitSegments[2],
    ]);
    expect(createJobs).toHaveBeenNthCalledWith(3, dispatchTarget, [
      unitSegments[3],
    ]);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target: dispatchTarget,
        node: message,
        tasks: expectedTasks,
      },
      scope,
    );

    expect(queue.executeJobs).toHaveBeenCalledTimes(3);
    expect(queue.executeJobs).toHaveBeenNthCalledWith(1, [expectedJobs[0]]);
    expect(queue.executeJobs).toHaveBeenNthCalledWith(2, [
      expectedJobs[1],
      expectedJobs[2],
    ]);
    expect(queue.executeJobs).toHaveBeenNthCalledWith(3, [expectedJobs[3]]);

    expect(delayFn).toHaveBeenCalledTimes(2);
  });

  it('execute "thunk" tasks after dispatch', async () => {
    const thunkEffect1 = moxy();
    const thunkEffect2 = moxy();
    const thunkEffect3 = moxy();

    const delayFn = moxy(async () => {});

    const expectedSegments = [
      unitSegments[0],
      {
        type: 'thunk',
        node: <Sociably.Thunk effect={thunkEffect1} />,
        value: thunkEffect1,
      },
      { type: 'pause', node: <Sociably.Pause />, value: null },
      unitSegments[1],
      {
        type: 'thunk',
        node: <Sociably.Thunk effect={thunkEffect2} />,
        value: thunkEffect2,
      },
      unitSegments[2],
      {
        type: 'pause',
        node: <Sociably.Pause delay={delayFn} />,
        value: delayFn,
      },
      {
        type: 'thunk',
        node: <Sociably.Thunk effect={thunkEffect3} />,
        value: thunkEffect3,
      },
      unitSegments[3],
    ];

    renderer.render.mock.fakeReturnValue(expectedSegments);

    const expectedJobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const expectedResults = ['result#1', 'result#2', 'result#3', 'result#4'];
    const expectedTasks = [
      { type: 'dispatch', payload: [{ id: 1 }] },
      { type: 'thunk', payload: thunkEffect1 },
      { type: 'pause', payload: null },
      { type: 'dispatch', payload: [{ id: 2 }, { id: 3 }] },
      { type: 'thunk', payload: thunkEffect2 },
      { type: 'pause', payload: delayFn },
      { type: 'dispatch', payload: [{ id: 4 }] },
      { type: 'thunk', payload: thunkEffect3 },
    ];

    await expect(
      engine.render(dispatchTarget, message, createJobs),
    ).resolves.toEqual({
      jobs: expectedJobs,
      results: expectedResults,
      tasks: expectedTasks,
    });

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(initScope).toHaveBeenCalledTimes(1);

    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(message, scope, [
      [RenderingTargetI, dispatchTarget],
    ]);

    expect(createJobs).toHaveBeenCalledTimes(3);
    expect(createJobs).toHaveBeenNthCalledWith(1, dispatchTarget, [
      unitSegments[0],
    ]);
    expect(createJobs).toHaveBeenNthCalledWith(2, dispatchTarget, [
      unitSegments[1],
      unitSegments[2],
    ]);
    expect(createJobs).toHaveBeenNthCalledWith(3, dispatchTarget, [
      unitSegments[3],
    ]);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target: dispatchTarget,
        node: message,
        tasks: expectedTasks,
      },
      scope,
    );

    expect(queue.executeJobs).toHaveBeenCalledTimes(3);
    expect(queue.executeJobs).toHaveBeenNthCalledWith(1, [expectedJobs[0]]);
    expect(queue.executeJobs).toHaveBeenNthCalledWith(2, [
      expectedJobs[1],
      expectedJobs[2],
    ]);
    expect(queue.executeJobs).toHaveBeenNthCalledWith(3, [expectedJobs[3]]);

    expect(thunkEffect1).toHaveBeenCalledTimes(1);
    expect(thunkEffect2).toHaveBeenCalledTimes(1);
    expect(thunkEffect3).toHaveBeenCalledTimes(1);

    expect(delayFn).toHaveBeenCalledTimes(1);
  });

  it('throw DispatchError when thunks thrown', async () => {
    const thunkEffect = moxy(() => Promise.resolve());
    const failThunkEffect = moxy(() => Promise.reject(new Error('ゴゴゴ')));

    const thunkSegment = {
      type: 'thunk',
      node: <Sociably.Thunk effect={thunkEffect} />,
      value: thunkEffect,
    };
    const failThunkSegment = {
      type: 'thunk',
      node: <Sociably.Thunk effect={failThunkEffect} />,
      value: failThunkEffect,
    };

    const segments = [
      failThunkSegment,
      unitSegments[0],
      thunkSegment,
      unitSegments[1],
      failThunkSegment,
      unitSegments[2],
      thunkSegment,
      unitSegments[3],
    ];

    renderer.render.mock.fake(() => Promise.resolve(segments));
    const dispatchPromise = engine.render(dispatchTarget, message, createJobs);

    await expect(dispatchPromise).rejects.toThrow('ゴゴゴ');

    try {
      await dispatchPromise;
    } catch (err) {
      const expectedJobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

      expect(err).toBeInstanceOf(DispatchError);
      expect(err.errors).toEqual([new Error('ゴゴゴ'), new Error('ゴゴゴ')]);
      expect(err.tasks).toEqual([
        { type: 'dispatch', payload: expectedJobs },
        { type: 'thunk', payload: failThunkEffect },
        { type: 'thunk', payload: thunkEffect },
        { type: 'thunk', payload: failThunkEffect },
        { type: 'thunk', payload: thunkEffect },
      ]);
      expect(err.jobs).toEqual(expectedJobs);
      expect(err.results).toEqual([
        'result#1',
        'result#2',
        'result#3',
        'result#4',
      ]);

      expect(err.message).toMatchInlineSnapshot(`
        "Errors happen while sending:
        	1) Error: ゴゴゴ
        	2) Error: ゴゴゴ"
      `);
    }

    expect(thunkEffect).toHaveBeenCalledTimes(2);
    expect(failThunkEffect).toHaveBeenCalledTimes(2);

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
  });

  it('throw what renderer thrown', async () => {
    renderer.render.mock.fake(() =>
      Promise.reject(new Error('You rendered a BOMB!')),
    );

    await expect(
      engine.render(dispatchTarget, message, createJobs),
    ).rejects.toThrow('You rendered a BOMB!');

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(message, scope, [
      [RenderingTargetI, dispatchTarget],
    ]);

    expect(createJobs).not.toHaveBeenCalled();
    expect(wrappedDispatchMock).not.toHaveBeenCalled();
    expect(queue.executeJobs).not.toHaveBeenCalled();
  });

  it('throw what createJob function thrown', async () => {
    createJobs.mock.fake(() => {
      throw new Error('There is a BOMB in segments!');
    });

    await expect(
      engine.render(dispatchTarget, message, createJobs),
    ).rejects.toThrow('There is a BOMB in segments!');

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).not.toHaveBeenCalled();
    expect(queue.executeJobs).not.toHaveBeenCalled();
  });

  it('throws if job execution fail', async () => {
    const err1 = new Error("I'm failed.");
    const err2 = new Error("I'm failed too.");
    const execResponse = {
      success: false,
      errors: [err1, err2],
      batch: [
        { success: true, job: { id: 1 }, result: "I'm ok." },
        { success: false, job: { id: 2 }, result: "I'm failed.", error: err1 },
        {
          success: false,
          job: { id: 3 },
          result: "I'm failed too.",
          error: err2,
        },
        undefined,
      ],
    };

    queue.executeJobs.mock.fake(() => Promise.resolve(execResponse));

    const renderPromise = engine.render(dispatchTarget, message, createJobs);

    await expect(renderPromise).rejects.toThrowErrorMatchingInlineSnapshot(`
"Errors happen while sending:
	1) Error: I'm failed.
	2) Error: I'm failed too."
`);

    const expectedJobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    try {
      await renderPromise;
    } catch (err) {
      expect(err).toBeInstanceOf(DispatchError);
      expect({ ...err }).toEqual({
        jobs: expectedJobs,
        results: ["I'm ok.", "I'm failed.", "I'm failed too.", undefined],
        errors: [err1, err2],
        tasks: [
          {
            type: 'dispatch',
            payload: expectedJobs,
          },
        ],
      });
    }

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledWith(expectedJobs);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
  });

  test('wrapper can modify tasks from dispatch frame', async () => {
    const segments = [{ type: 'unit', node: <foo />, value: { id: 'foo' } }];
    renderer.render.mock.fake(async () => segments);
    createJobs.mock.fakeReturnValue([{ id: 'foo' }]);

    const originalTasks = [{ type: 'dispatch', payload: [{ id: 'foo' }] }];
    const modifiedTasks = [{ type: 'dispatch', payload: [{ id: 'bar' }] }];

    dispatchWrapper.mock.fake((dispatch) =>
      wrappedDispatchMock.proxify((frame) =>
        dispatch({ ...frame, tasks: modifiedTasks }),
      ),
    );

    await expect(
      new Engine(
        'test',
        renderer,
        queue,
        worker,
        initScope,
        dispatchWrapper,
      ).render(dispatchTarget, message, createJobs),
    ).resolves.toEqual({
      jobs: [{ id: 'bar' }],
      results: ['result#bar'],
      tasks: modifiedTasks,
    });

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledWith(dispatchTarget, segments);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target: dispatchTarget,
        node: message,
        tasks: originalTasks,
      },
      scope,
    );

    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledWith([{ id: 'bar' }]);
  });

  test('wrapper can modify response resolved from dispatcher', async () => {
    dispatchWrapper.mock.fake((dispatch) =>
      wrappedDispatchMock.proxify(async (frame) => {
        const response = await dispatch(frame);
        return {
          ...response,
          results: response.results.map((r) => `${r}👍`),
          hello: 'world',
        };
      }),
    );

    const expectedJobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const expectedTasks = [{ type: 'dispatch', payload: expectedJobs }];

    await expect(
      new Engine(
        'test',
        renderer,
        queue,
        worker,
        initScope,
        dispatchWrapper,
      ).render(dispatchTarget, message, createJobs),
    ).resolves.toEqual({
      tasks: expectedTasks,
      jobs: expectedJobs,
      results: ['result#1👍', 'result#2👍', 'result#3👍', 'result#4👍'],
      hello: 'world',
    });

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledTimes(1);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target: dispatchTarget,
        node: message,
        tasks: expectedTasks,
      },
      scope,
    );

    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledWith(expectedJobs);
  });

  test('wrapper can bypass dispatch', async () => {
    wrappedDispatchMock.fake(() => Promise.resolve(null));

    await expect(
      engine.render(dispatchTarget, message, createJobs),
    ).resolves.toBe(null);

    expect(initScope).toHaveBeenCalledTimes(1);

    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(message, scope, [
      [RenderingTargetI, dispatchTarget],
    ]);

    expect(createJobs).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledWith(dispatchTarget, unitSegments);

    expect(queue.executeJobs).not.toHaveBeenCalled();

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target: dispatchTarget,
        node: message,
        tasks: [
          {
            type: 'dispatch',
            payload: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
          },
        ],
      },
      scope,
    );
  });

  test('with no initScope and dispatchWrapper params', async () => {
    const myEngine = new Engine('test', renderer, queue, worker);

    await myEngine.render(dispatchTarget, message, createJobs);

    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(
      message,
      expect.any(ServiceScope),
      [[RenderingTargetI, dispatchTarget]],
    );

    expect(initScope).not.toHaveBeenCalled();
    expect(wrappedDispatchMock).not.toHaveBeenCalled();
    expect(createJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
  });

  it('throw what wrappedDispatcher thrown', async () => {
    wrappedDispatchMock.fake(async () => {
      throw new Error('something wrong within middlewares');
    });

    await expect(
      engine.render(dispatchTarget, message, createJobs),
    ).rejects.toThrow('something wrong within middlewares');

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(createJobs).toHaveBeenCalledTimes(1);
    expect(initScope).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).not.toHaveBeenCalled();
  });
});

describe('.dispatchJobs(target, tasks, node)', () => {
  const engine = new Engine(
    'test',
    renderer,
    queue,
    worker,
    initScope,
    dispatchWrapper,
  );

  const target = {
    platform: 'test',
    uid: 'test.foo',
    uniqueIdentifier: { platform: 'test', id: 'foo' },
  };
  const jobs = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('dispatch jobs', async () => {
    const expectedTasks = [{ type: 'dispatch', payload: jobs }];

    await expect(engine.dispatchJobs(target, jobs)).resolves.toEqual({
      tasks: expectedTasks,
      jobs,
      results: ['result#1', 'result#2', 'result#3'],
    });

    expect(initScope).toHaveBeenCalledTimes(1);

    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledWith(jobs);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target,
        node: null,
        tasks: expectedTasks,
      },
      scope,
    );
  });

  it('throws if job execution fail', async () => {
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

    const dispatchPromise = engine.dispatchJobs(target, jobs);

    await expect(dispatchPromise).rejects.toThrowErrorMatchingInlineSnapshot(`
"Errors happen while sending:
	1) Error: bad thing 1
	2) Error: bad thing 2"
`);

    try {
      await dispatchPromise;
    } catch (err) {
      expect(err).toBeInstanceOf(DispatchError);
      expect({ ...err }).toEqual({
        jobs,
        results: ["I'm only one survived", undefined, undefined],
        errors: [err1, err2],
        tasks: [
          { type: 'dispatch', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] },
        ],
      });
    }

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
  });

  test('wrapper can modify tasks of frame', async () => {
    const modifiedTasks = [{ type: 'dispatch', payload: [{ id: 'bar' }] }];
    dispatchWrapper.mock.fake((dispatch) =>
      wrappedDispatchMock.proxify((frame) =>
        dispatch({
          ...frame,
          tasks: modifiedTasks,
        }),
      ),
    );

    await expect(
      new Engine(
        'test',
        renderer,
        queue,
        worker,
        initScope,
        dispatchWrapper,
      ).dispatchJobs(target, [{ id: 'foo' }]),
    ).resolves.toEqual({
      jobs: [{ id: 'bar' }],
      results: ['result#bar'],
      tasks: modifiedTasks,
    });

    expect(initScope).toHaveBeenCalledTimes(1);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target,
        node: null,
        tasks: [{ type: 'dispatch', payload: [{ id: 'foo' }] }],
      },
      scope,
    );

    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledWith([{ id: 'bar' }]);
  });

  test('wrapper can modify response resolved from dispatcher', async () => {
    dispatchWrapper.mock.fake((dispatch) =>
      wrappedDispatchMock.proxify(async (frame) => {
        const response = await dispatch(frame);
        return {
          ...response,
          results: response.results.map((r) => `${r}👍`),
          hello: 'world',
        };
      }),
    );

    await expect(
      new Engine(
        'test',
        renderer,
        queue,
        worker,
        initScope,
        dispatchWrapper,
      ).dispatchJobs(target, jobs),
    ).resolves.toEqual({
      jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
      results: ['result#1👍', 'result#2👍', 'result#3👍'],
      tasks: [{ type: 'dispatch', payload: jobs }],
      hello: 'world',
    });

    expect(initScope).toHaveBeenCalledTimes(1);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target,
        node: null,
        tasks: [{ type: 'dispatch', payload: jobs }],
      },
      scope,
    );

    expect(queue.executeJobs).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).toHaveBeenCalledWith(jobs);
  });

  test('wrapper can bypass dispatch', async () => {
    wrappedDispatchMock.fake(() => Promise.resolve(null));
    await expect(engine.dispatchJobs(target, jobs)).resolves.toBe(null);

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).not.toHaveBeenCalled();

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith(
      {
        platform: 'test',
        target,
        node: null,
        tasks: [{ type: 'dispatch', payload: jobs }],
      },
      scope,
    );
  });

  it('throw what wrappedDispatcher thrown', async () => {
    wrappedDispatchMock.fake(async () => {
      throw new Error('something wrong within middlewares');
    });

    await expect(engine.dispatchJobs(target, jobs)).rejects.toThrow(
      'something wrong within middlewares',
    );

    expect(initScope).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs).not.toHaveBeenCalled();
  });
});
