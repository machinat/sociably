/* eslint-disable no-param-reassign */
import moxy from 'moxy';
import Machinat from 'machinat';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';

import Engine from '../engine';
import DispatchError from '../error';

const MyService = Machinat.createService(() => () => {});

const element = (
  <>
    <a id={1} />
    <b id={2} />
    <c id={3} />
  </>
);
const options = { foo: 'bar' };

const bot = { name: 'r2d2', send: moxy() };

const unitSegments = [
  { type: 'unit', node: <a id={1} />, value: { id: 1 } },
  { type: 'unit', node: <b id={2} />, value: { id: 2 } },
  { type: 'unit', node: <c id={3} />, value: { id: 3 } },
  { type: 'unit', node: <c id={4} />, value: { id: 4 } },
];

const queue = moxy(new Queue(), {
  excludeProps: ['_*'],
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
  bot.send.mock.reset();
  queue.executeJobs.mock.reset();
  queue.executeJobs.mock.fake(jobs =>
    Promise.resolve({
      success: true,
      batch: jobs.map(job => ({ job, success: true, result: job.id })),
    })
  );

  renderer.render.mock.reset();
  renderer.render.mock.fakeReturnValue(unitSegments);

  worker.mock.reset();
});

describe('#constructor()', () => {
  it('attach porps and start worker', () => {
    const engine = new Engine('test', bot, renderer, queue, worker, []);

    expect(engine.platform).toBe('test');
    expect(engine.bot).toBe(bot);
    expect(engine.renderer).toBe(renderer);
    expect(engine.queue).toBe(queue);
    expect(engine.worker).toBe(worker);

    expect(worker.start.mock).toHaveBeenCalledTimes(1);
    expect(worker.start.mock).toHaveBeenCalledWith(queue);
  });

  it('throws if non function pass as dispatchMiddlewares', () => {
    const invalidParams = [undefined, null, 1, true, 'foo', {}];

    invalidParams.forEach(p =>
      expect(
        () => new Engine('test', bot, renderer, queue, worker, [p])
      ).toThrow()
    );
  });
});

describe('#renderTasks(createJobs, target, message, options, allowPause)', () => {
  const createJobs = moxy((_, segemnts) =>
    segemnts.map(({ value: { id } }) => ({ id }))
  );

  beforeEach(() => {
    createJobs.mock.clear();
  });

  it('render message and create "transmit" tasks', async () => {
    const engine = new Engine('test', bot, renderer, queue, worker, []);
    await expect(
      engine.renderTasks(createJobs, 'foo', element, { bar: 1 }, true)
    ).resolves.toEqual([
      {
        type: 'transmit',
        payload: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      },
    ]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, true);

    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith('foo', unitSegments, {
      bar: 1,
    });
  });

  it('pass allowPause to renderer.render', async () => {
    const engine = new Engine('test', bot, renderer, queue, worker, []);
    await expect(
      engine.renderTasks(createJobs, 'foo', element, { bar: 1 }, false)
    ).resolves.toEqual([
      {
        type: 'transmit',
        payload: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      },
    ]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, false);

    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith('foo', unitSegments, {
      bar: 1,
    });
  });

  it('create "pause" task out of "pause" segments which separate "transmit" action', async () => {
    const segments = [
      unitSegments[0],
      { type: 'pause', node: <Machinat.Pause />, value: undefined },
      unitSegments[1],
      unitSegments[2],
      { type: 'pause', node: <Machinat.Pause />, value: undefined },
      unitSegments[3],
    ];

    renderer.render.mock.fakeReturnValue(segments);

    const engine = new Engine('test', bot, renderer, queue, worker, []);
    await expect(
      engine.renderTasks(createJobs, 'foo', element, { bar: 1 }, true)
    ).resolves.toEqual([
      { type: 'transmit', payload: [{ id: 1 }] },
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'transmit', payload: [{ id: 2 }, { id: 3 }] },
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'transmit', payload: [{ id: 4 }] },
    ]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, true);

    expect(createJobs.mock).toHaveBeenCalledTimes(3);
    expect(createJobs.mock) //
      .toHaveBeenNthCalledWith(1, 'foo', [unitSegments[0]], { bar: 1 });
    expect(createJobs.mock) //
      .toHaveBeenNthCalledWith(2, 'foo', unitSegments.slice(1, 3), { bar: 1 });
    expect(createJobs.mock) //
      .toHaveBeenNthCalledWith(3, 'foo', [unitSegments[3]], { bar: 1 });
  });

  it('collect "thunk" tasks and place it after "transmit" task', async () => {
    const thunkFn = moxy();

    const segments = [
      unitSegments[0],
      { type: 'thunk', node: <MyService.Consumer />, value: thunkFn },
      { type: 'pause', node: <Machinat.Pause />, value: undefined },
      unitSegments[1],
      { type: 'thunk', node: <MyService.Consumer />, value: thunkFn },
      unitSegments[2],
      { type: 'pause', node: <Machinat.Pause />, value: undefined },
      { type: 'thunk', node: <MyService.Consumer />, value: thunkFn },
      unitSegments[3],
    ];

    renderer.render.mock.fakeReturnValue(segments);

    const engine = new Engine('test', bot, renderer, queue, worker, []);
    await expect(
      engine.renderTasks(createJobs, 'foo', element, { bar: 1 }, true)
    ).resolves.toEqual([
      { type: 'transmit', payload: [{ id: 1 }] },
      { type: 'thunk', payload: thunkFn },
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'transmit', payload: [{ id: 2 }, { id: 3 }] },
      { type: 'thunk', payload: thunkFn },
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'transmit', payload: [{ id: 4 }] },
      { type: 'thunk', payload: thunkFn },
    ]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, true);

    expect(createJobs.mock).toHaveBeenCalledTimes(3);
    expect(createJobs.mock) //
      .toHaveBeenNthCalledWith(1, 'foo', [unitSegments[0]], { bar: 1 });
    expect(createJobs.mock) //
      .toHaveBeenNthCalledWith(2, 'foo', unitSegments.slice(1, 3), { bar: 1 });
    expect(createJobs.mock) //
      .toHaveBeenNthCalledWith(3, 'foo', [unitSegments[3]], { bar: 1 });
  });
});

describe('#dispatch(channel, tasks, node)', () => {
  it('renders and enqueue jobs and return array of results', async () => {
    const engine = new Engine('test', bot, renderer, queue, worker, []);
    const tasks = [
      { type: 'transmit', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    ];

    await expect(engine.dispatch(channel, tasks, element)).resolves.toEqual({
      tasks,
      jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
      results: [1, 2, 3],
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledWith([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
  });

  it('pass dispatch frame through middlewares', async () => {
    const jobs = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const tasks = [{ type: 'transmit', payload: jobs }];

    const expectedFrame = {
      platform: 'test',
      bot,
      channel,
      node: element,
      tasks,
    };

    const middleware1 = moxy(next => async frame => {
      expect(frame).toEqual(expectedFrame);

      frame.foo = 1;
      const response = await next(frame);

      expect(response).toEqual({ tasks, jobs, results: [1, 2, 3], bar: 2 });
      response.bar = 1;

      return response;
    });

    const middleware2 = moxy(next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: 1 });

      frame.foo = 2;
      const response = await next(frame);

      expect(response).toEqual({ tasks, jobs, results: [1, 2, 3], bar: 3 });
      response.bar = 2;

      return response;
    });

    const middleware3 = moxy(next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: 2 });

      frame.foo = 3;
      const response = await next(frame);

      expect(response).toEqual({ tasks, jobs, results: [1, 2, 3] });
      response.bar = 3;

      return response;
    });

    const engine = new Engine('test', bot, renderer, queue, worker, [
      middleware1,
      middleware2,
      middleware3,
    ]);

    expect(middleware1.mock).toHaveBeenCalledTimes(1);
    expect(middleware2.mock).toHaveBeenCalledTimes(1);
    expect(middleware3.mock).toHaveBeenCalledTimes(1);

    await expect(engine.dispatch(channel, tasks, element)).resolves.toEqual({
      bar: 1,
      tasks,
      jobs,
      results: [1, 2, 3],
    });

    expect(queue.executeJobs.mock).toHaveBeenCalledWith([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
  });

  it('can bypass the event emitting within middleware', async () => {
    const tasks = [
      { type: 'transmit', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    ];

    const middleware = moxy(() => async () => ({
      tasks,
      jobs: [{ id: 0 }],
      results: [{ nothing: 'happened' }],
    }));

    const engine = new Engine('test', bot, renderer, queue, worker, [
      middleware,
    ]);

    await expect(engine.dispatch(channel, tasks, element)).resolves.toEqual({
      tasks,
      jobs: [{ id: 0 }],
      results: [{ nothing: 'happened' }],
    });

    expect(middleware.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('can skip following middlewares with error thrown in middleware', async () => {
    const middleware = moxy(() => async () => {
      throw new Error('something wrong with the element');
    });

    const engine = new Engine('test', bot, renderer, queue, worker, [
      middleware,
    ]);

    await expect(engine.dispatch(channel, element, options)).rejects.toThrow(
      'something wrong with the element'
    );

    expect(middleware.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('waits pause', async () => {
    let pauseCount = 0;
    const until = moxy(async () => {
      expect(queue.executeJobs.mock).toHaveBeenCalledTimes(pauseCount++); // eslint-disable-line no-plusplus
    });

    const tasks = [
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 1 }] },
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 2 }, { id: 3 }] },
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 4 }] },
    ];

    const engine = new Engine('test', bot, renderer, queue, worker, []);

    await expect(engine.dispatch(channel, tasks, element)).resolves.toEqual({
      tasks,
      jobs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      results: [1, 2, 3, 4],
    });
    expect(until.mock).toHaveBeenCalledTimes(3);

    expect(queue.executeJobs.mock).toHaveBeenCalledTimes(3);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(1, [{ id: 1 }]);
    expect(queue.executeJobs.mock) //
      .toHaveBeenNthCalledWith(2, [{ id: 2 }, { id: 3 }]);
    expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(3, [{ id: 4 }]);
  });

  it('execute thunk tasks after all other tasks executed', async () => {
    let pauseCount = 0;
    const thunkFn = moxy(async () => {});
    const until = moxy(async () => {
      expect(thunkFn.mock).not.toHaveBeenCalled();
      expect(queue.executeJobs.mock).toHaveBeenCalledTimes(pauseCount++); // eslint-disable-line no-plusplus
    });

    const tasks = [
      { type: 'thunk', payload: thunkFn },
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 1 }] },
      { type: 'thunk', payload: thunkFn },
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 2 }, { id: 3 }] },
      { type: 'thunk', payload: thunkFn },
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 4 }] },
      { type: 'thunk', payload: thunkFn },
    ];

    const engine = new Engine('test', bot, renderer, queue, worker, []);

    await expect(engine.dispatch(channel, tasks, element)).resolves.toEqual({
      tasks,
      jobs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      results: [1, 2, 3, 4],
    });
    expect(until.mock).toHaveBeenCalledTimes(3);
    expect(thunkFn.mock).toHaveBeenCalledTimes(4);
  });

  it('throw DispatchError when thunks thrown', async () => {
    let thunkCount = 0;
    const thunkFn = moxy(() =>
      thunkCount++ % 2 // eslint-disable-line no-plusplus
        ? Promise.reject(new Error('ゴゴゴ'))
        : Promise.resolve()
    );
    const until = moxy(async () => {
      expect(thunkFn.mock).not.toHaveBeenCalled();
    });

    const tasks = [
      { type: 'thunk', payload: thunkFn },
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 1 }] },
      { type: 'thunk', payload: thunkFn },
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 2 }, { id: 3 }] },
      { type: 'thunk', payload: thunkFn },
      { type: 'pause', payload: <Machinat.Pause until={until} /> },
      { type: 'transmit', payload: [{ id: 4 }] },
      { type: 'thunk', payload: thunkFn },
    ];

    const engine = new Engine('test', bot, renderer, queue, worker, []);

    let thrown = false;
    try {
      await engine.dispatch(channel, tasks, element);
    } catch (err) {
      thrown = true;

      expect(err).toBeInstanceOf(DispatchError);
      expect(err.errors).toEqual([new Error('ゴゴゴ'), new Error('ゴゴゴ')]);
      expect(err.tasks).toEqual(tasks);
      expect(err.jobs).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      expect(err.results).toEqual([1, 2, 3, 4]);

      expect(err.message).toEqual(expect.stringContaining('ゴゴゴ'));
    }

    expect(thrown).toBe(true);

    expect(until.mock).toHaveBeenCalledTimes(3);
    expect(thunkFn.mock).toHaveBeenCalledTimes(4);
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
    const tasks = [{ type: 'transmit', payload: [1, 2, 3] }];

    queue.executeJobs.mock.fake(() => Promise.resolve(execResponse));

    const engine = new Engine('test', bot, renderer, queue, worker, []);

    let isThrown = false;
    try {
      await engine.dispatch(channel, tasks);
    } catch (err) {
      isThrown = true;
      expect(err.errors).toEqual([err1, err2]);
      expect(err.tasks).toEqual(tasks);
      expect(err.jobs).toEqual([1, 2, 3]);
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

    const middleware = next => async context => {
      try {
        return await next(context);
      } catch (err) {
        expect(err).toEqual(new Error('bad thing!'));
        return { results: [{ something: 'else' }] };
      }
    };

    const engine = new Engine('test', bot, renderer, queue, worker, [
      middleware,
    ]);

    await expect(
      engine.dispatch(channel, [{ type: 'transmit', payload: [1, 2, 3] }])
    ).resolves.toEqual({ results: [{ something: 'else' }] });
  });
});
