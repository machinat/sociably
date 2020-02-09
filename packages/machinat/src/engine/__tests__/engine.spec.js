/* eslint-disable no-param-reassign */
import moxy, { Mock } from 'moxy';
import Machinat from '../..';

import Engine from '../engine';
import DispatchError from '../error';

const bot = { name: 'r2d2', send: moxy() };

const queue = moxy({
  executeJobs(jobs) {
    return Promise.resolve({
      success: true,
      batch: jobs.map(job => ({
        job,
        success: true,
        result: `result#${job.id}`,
      })),
    });
  },
});

const worker = moxy({
  start: () => true,
  stop: () => true,
});

const renderer = moxy({ render: () => null });

const scope = moxy();
const initScopeMock = new Mock();
const wrappedDispatchMock = new Mock();

const dispatchScopeWrapper = moxy(dispatcher => {
  const wrappedDispatcher = wrappedDispatchMock.proxify(dispatcher);

  const initScope = initScopeMock.proxify(() =>
    Promise.resolve({
      scope,
      wrappedDispatcher,
    })
  );
  return initScope;
});

beforeEach(() => {
  renderer.mock.reset();
  worker.mock.reset();
  queue.mock.reset();

  dispatchScopeWrapper.mock.reset();
  initScopeMock.reset();
  wrappedDispatchMock.reset();
});

describe('#constructor()', () => {
  test('contstructing ok', () => {
    const engine = new Engine(
      'test',
      bot,
      renderer,
      queue,
      worker,
      dispatchScopeWrapper
    );

    expect(engine.platform).toBe('test');
    expect(engine.bot).toBe(bot);
    expect(engine.renderer).toBe(renderer);
    expect(engine.queue).toBe(queue);
    expect(engine.worker).toBe(worker);

    expect(worker.start.mock).toHaveBeenCalledTimes(1);
    expect(worker.start.mock).toHaveBeenCalledWith(queue);
  });
});

describe('#render(channel, node, createJobs)', () => {
  const channel = {
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

  const createJobs = moxy(segemnts =>
    segemnts.map(({ value: { id } }) => ({ id }))
  );

  const engine = new Engine(
    'test',
    bot,
    renderer,
    queue,
    worker,
    dispatchScopeWrapper
  );

  beforeEach(() => {
    renderer.render.mock.fakeReturnValue(unitSegments);
    createJobs.mock.reset();
  });

  it('resolve null renderer.ernder() resolve null', async () => {
    renderer.render.mock.fake(() => Promise.resolve(null));

    await expect(engine.render(channel, message, createJobs)).resolves.toBe(
      null
    );

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(scope, message);

    expect(createJobs.mock).not.toHaveBeenCalled();
    expect(wrappedDispatchMock).not.toHaveBeenCalled();
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('render message, create jobs then dispatch', async () => {
    const expectedJobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const expectedResults = ['result#1', 'result#2', 'result#3', 'result#4'];
    const expectedTasks = [{ type: 'dispatch', payload: expectedJobs }];

    await expect(engine.render(channel, message, createJobs)).resolves.toEqual({
      jobs: expectedJobs,
      results: expectedResults,
      tasks: expectedTasks,
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(scope, message);

    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith(unitSegments, channel);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: message,
      tasks: expectedTasks,
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledWith(expectedJobs);
  });

  it('make "pause" task from "pause" segments which separate "dispatch" tasks', async () => {
    const delayFn = moxy(async () => {});
    const segmentsWithPauses = [
      {
        type: 'pause',
        node: <Machinat.Pause until={delayFn} />,
        value: delayFn,
      },
      unitSegments[0],
      { type: 'pause', node: <Machinat.Pause />, value: null },
      unitSegments[1],
      unitSegments[2],
      {
        type: 'pause',
        node: <Machinat.Pause until={delayFn} />,
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

    await expect(engine.render(channel, message, createJobs)).resolves.toEqual({
      jobs: expectedJobs,
      results: expectedResults,
      tasks: expectedTasks,
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(scope, message);

    expect(createJobs.mock).toHaveBeenCalledTimes(3);
    expect(createJobs.mock).toHaveBeenNthCalledWith(
      1,
      [unitSegments[0]],
      channel
    );
    expect(createJobs.mock).toHaveBeenNthCalledWith(
      2,
      [unitSegments[1], unitSegments[2]],
      channel
    );
    expect(createJobs.mock).toHaveBeenNthCalledWith(
      3,
      [unitSegments[3]],
      channel
    );

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: message,
      tasks: expectedTasks,
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(3);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(1, [
      expectedJobs[0],
    ]);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(2, [
      expectedJobs[1],
      expectedJobs[2],
    ]);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(3, [
      expectedJobs[3],
    ]);

    expect(delayFn.mock).toHaveBeenCalledTimes(2);
  });

  it('make "thunk" tasks from "thunk" segment and execute them after dispatch', async () => {
    const thunkEffect1 = moxy();
    const thunkEffect2 = moxy();
    const thunkEffect3 = moxy();

    const delayFn = moxy(async () => {});

    const expectedSegments = [
      unitSegments[0],
      {
        type: 'thunk',
        node: <Machinat.Thunk effect={thunkEffect1} />,
        value: thunkEffect1,
      },
      { type: 'pause', node: <Machinat.Pause />, value: null },
      unitSegments[1],
      {
        type: 'thunk',
        node: <Machinat.Thunk effect={thunkEffect2} />,
        value: thunkEffect2,
      },
      unitSegments[2],
      {
        type: 'pause',
        node: <Machinat.Pause until={delayFn} />,
        value: delayFn,
      },
      {
        type: 'thunk',
        node: <Machinat.Thunk effect={thunkEffect3} />,
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

    await expect(engine.render(channel, message, createJobs)).resolves.toEqual({
      jobs: expectedJobs,
      results: expectedResults,
      tasks: expectedTasks,
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(initScopeMock).toHaveBeenCalledTimes(1);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(scope, message);

    expect(createJobs.mock).toHaveBeenCalledTimes(3);
    expect(createJobs.mock).toHaveBeenNthCalledWith(
      1,
      [unitSegments[0]],
      channel
    );
    expect(createJobs.mock).toHaveBeenNthCalledWith(
      2,
      [unitSegments[1], unitSegments[2]],
      channel
    );
    expect(createJobs.mock).toHaveBeenNthCalledWith(
      3,
      [unitSegments[3]],
      channel
    );

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: message,
      tasks: expectedTasks,
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(3);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(1, [
      expectedJobs[0],
    ]);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(2, [
      expectedJobs[1],
      expectedJobs[2],
    ]);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(3, [
      expectedJobs[3],
    ]);

    expect(thunkEffect1.mock).toHaveBeenCalledTimes(1);
    expect(thunkEffect2.mock).toHaveBeenCalledTimes(1);
    expect(thunkEffect3.mock).toHaveBeenCalledTimes(1);

    expect(delayFn.mock).toHaveBeenCalledTimes(1);
  });

  it('throw DispatchError when thunks thrown', async () => {
    const thunkEffect = moxy(() => Promise.resolve());
    const failThunkEffect = moxy(() => Promise.reject(new Error('ゴゴゴ')));

    const thunkSegment = {
      type: 'thunk',
      node: <Machinat.Thunk effect={thunkEffect} />,
      value: thunkEffect,
    };
    const failThunkSegment = {
      type: 'thunk',
      node: <Machinat.Thunk effect={failThunkEffect} />,
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
    const dispatchPromise = engine.render(channel, message, createJobs);

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

    expect(thunkEffect.mock).toHaveBeenCalledTimes(2);
    expect(failThunkEffect.mock).toHaveBeenCalledTimes(2);

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
  });

  it('throw what renderer thrown', async () => {
    renderer.render.mock.fake(() =>
      Promise.reject(new Error('You rendered a BOMB!'))
    );

    await expect(engine.render(channel, message, createJobs)).rejects.toThrow(
      'You rendered a BOMB!'
    );

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(scope, message);

    expect(createJobs.mock).not.toHaveBeenCalled();
    expect(wrappedDispatchMock).not.toHaveBeenCalled();
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('throw what createJob function thrown', async () => {
    createJobs.mock.fake(() => {
      throw new Error('There is a BOMB in segments!');
    });

    await expect(engine.render(channel, message, createJobs)).rejects.toThrow(
      'There is a BOMB in segments!'
    );

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).not.toHaveBeenCalled();
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
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

    const renderPromise = engine.render(channel, message, createJobs);

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

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledWith(expectedJobs);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
  });

  test('wrapper can modify tasks from dispatch frame', async () => {
    const segments = [{ type: 'unit', node: <foo />, value: { id: 'foo' } }];
    renderer.render.mock.fake(async () => segments);
    createJobs.mock.fakeReturnValue([{ id: 'foo' }]);

    const originalTasks = [{ type: 'dispatch', payload: [{ id: 'foo' }] }];
    const modifiedTasks = [{ type: 'dispatch', payload: [{ id: 'bar' }] }];

    wrappedDispatchMock.wrap(dispatch => frame =>
      dispatch({ ...frame, tasks: modifiedTasks })
    );

    await expect(engine.render(channel, message, createJobs)).resolves.toEqual({
      jobs: [{ id: 'bar' }],
      results: ['result#bar'],
      tasks: modifiedTasks,
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith(segments, channel);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: message,
      tasks: originalTasks,
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledWith([{ id: 'bar' }]);
  });

  test('wrapper can modify response resolved from dispatcher', async () => {
    wrappedDispatchMock.wrap(dispatch => async frame => {
      const response = await dispatch(frame);
      return {
        ...response,
        results: response.results.map(r => `${r}👍`),
        hello: 'world',
      };
    });

    const expectedJobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const expectedTasks = [{ type: 'dispatch', payload: expectedJobs }];

    await expect(engine.render(channel, message, createJobs)).resolves.toEqual({
      tasks: expectedTasks,
      jobs: expectedJobs,
      results: ['result#1👍', 'result#2👍', 'result#3👍', 'result#4👍'],
      hello: 'world',
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledTimes(1);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: message,
      tasks: expectedTasks,
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledWith(expectedJobs);
  });

  test('wrapper can bypass dispatch', async () => {
    wrappedDispatchMock.fake(() => Promise.resolve(null));

    await expect(engine.render(channel, message, createJobs)).resolves.toBe(
      null
    );

    expect(initScopeMock).toHaveBeenCalledTimes(1);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(scope, message);

    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith(unitSegments, channel);

    expect(queue.executeJobs.mock).not.toHaveBeenCalled();

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: message,
      tasks: [
        {
          type: 'dispatch',
          payload: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        },
      ],
    });
  });

  it('throw what wrappedDispatcher thrown', async () => {
    wrappedDispatchMock.fake(async () => {
      throw new Error('something wrong within middlewares');
    });

    await expect(engine.render(channel, message, createJobs)).rejects.toThrow(
      'something wrong within middlewares'
    );

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });
});

describe('#dispatchJobs(channel, tasks, node)', () => {
  const engine = new Engine(
    'test',
    bot,
    renderer,
    queue,
    worker,
    dispatchScopeWrapper
  );

  const channel = { foo: 'channel' };
  const jobs = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('dispatch jobs', async () => {
    const expectedTasks = [{ type: 'dispatch', payload: jobs }];

    await expect(engine.dispatchJobs(channel, jobs)).resolves.toEqual({
      tasks: expectedTasks,
      jobs,
      results: ['result#1', 'result#2', 'result#3'],
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledWith(jobs);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: null,
      tasks: expectedTasks,
    });
  });

  it('dispatch jobs with node included in frame', async () => {
    const expectedTasks = [{ type: 'dispatch', payload: jobs }];

    await expect(engine.dispatchJobs(channel, jobs, <foo />)).resolves.toEqual({
      tasks: expectedTasks,
      jobs,
      results: ['result#1', 'result#2', 'result#3'],
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledWith(jobs);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: <foo />,
      tasks: expectedTasks,
    });
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

    const dispatchPromise = engine.dispatchJobs(channel, jobs);

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

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
  });

  test('wrapper can modify tasks from dispatch frame', async () => {
    const modifiedTasks = [{ type: 'dispatch', payload: [{ id: 'bar' }] }];
    wrappedDispatchMock.wrap(dispatch => frame =>
      dispatch({
        ...frame,
        tasks: modifiedTasks,
      })
    );

    await expect(
      engine.dispatchJobs(channel, [{ id: 'foo' }])
    ).resolves.toEqual({
      jobs: [{ id: 'bar' }],
      results: ['result#bar'],
      tasks: modifiedTasks,
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: null,
      tasks: [{ type: 'dispatch', payload: [{ id: 'foo' }] }],
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledWith([{ id: 'bar' }]);
  });

  test('wrapper can modify response resolved from dispatcher', async () => {
    wrappedDispatchMock.wrap(dispatch => async frame => {
      const response = await dispatch(frame);
      return {
        ...response,
        results: response.results.map(r => `${r}👍`),
        hello: 'world',
      };
    });

    await expect(engine.dispatchJobs(channel, jobs)).resolves.toEqual({
      jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
      results: ['result#1👍', 'result#2👍', 'result#3👍'],
      tasks: [{ type: 'dispatch', payload: jobs }],
      hello: 'world',
    });

    expect(initScopeMock).toHaveBeenCalledTimes(1);

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: null,
      tasks: [{ type: 'dispatch', payload: jobs }],
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).toHaveBeenCalledWith(jobs);
  });

  test('wrapper can bypass dispatch', async () => {
    wrappedDispatchMock.fake(() => Promise.resolve(null));
    await expect(engine.dispatchJobs(channel, jobs)).resolves.toBe(null);

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();

    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      channel,
      node: null,
      tasks: [{ type: 'dispatch', payload: jobs }],
    });
  });

  it('throw what wrappedDispatcher thrown', async () => {
    wrappedDispatchMock.fake(async () => {
      throw new Error('something wrong within middlewares');
    });

    await expect(engine.dispatchJobs(channel, jobs)).rejects.toThrow(
      'something wrong within middlewares'
    );

    expect(initScopeMock).toHaveBeenCalledTimes(1);
    expect(wrappedDispatchMock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });
});
