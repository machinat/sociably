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

const bot = { name: 'r2d2', send: moxy() };

const segments = [
  { type: 'unit', node: <a id={1} />, value: { id: 1 } },
  { type: 'unit', node: <b id={2} />, value: { id: 2 } },
  { type: 'unit', node: <c id={3} />, value: { id: 3 } },
];

const queue = moxy(new Queue(), {
  excludeProps: ['_*'],
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
  renderer.render.mock.fakeReturnValue(segments);
});

describe('#constructor()', () => {
  it('throws if non function pass as eventMiddlewares', () => {
    const invalidParams = [undefined, null, 1, true, 'foo', {}];

    invalidParams.forEach(p =>
      expect(() => new Engine('test', bot, renderer, queue, [p], [])).toThrow()
    );
  });

  it('throws if non function pass as dispatchMiddlewares', () => {
    const invalidParams = [undefined, null, 1, true, 'foo', {}];

    invalidParams.forEach(p =>
      expect(() => new Engine('test', bot, renderer, queue, [], [p])).toThrow()
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

  it('render message and create "transmit" tasks', () => {
    const engine = new Engine('test', bot, renderer, queue, [], []);
    expect(
      engine.renderTasks(createJobs, 'foo', element, { bar: 1 }, true)
    ).toEqual([
      { type: 'transmit', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    ]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, true);

    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith('foo', segments, {
      bar: 1,
    });
  });

  it('pass allowPause to renderer.render', () => {
    const engine = new Engine('test', bot, renderer, queue, [], []);
    expect(
      engine.renderTasks(createJobs, 'foo', element, { bar: 1 }, false)
    ).toEqual([
      { type: 'transmit', payload: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    ]);

    expect(renderer.render.mock).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock).toHaveBeenCalledWith(element, false);

    expect(createJobs.mock).toHaveBeenCalledTimes(1);
    expect(createJobs.mock).toHaveBeenCalledWith('foo', segments, {
      bar: 1,
    });
  });

  it('create "pause" action out of "pause" segments which separate "transmit" action', () => {
    const segmentsWithPause = [
      { type: 'pause', node: <Machinat.Pause />, value: undefined },
      segments[0],
      segments[1],
      { type: 'pause', node: <Machinat.Pause />, value: undefined },
      segments[2],
    ];

    renderer.render.mock.fakeReturnValue(segmentsWithPause);

    const engine = new Engine('test', bot, renderer, queue, [], []);
    expect(
      engine.renderTasks(createJobs, 'foo', element, { bar: 1 }, true)
    ).toEqual([
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'transmit', payload: [{ id: 1 }, { id: 2 }] },
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'transmit', payload: [{ id: 3 }] },
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

describe('#dispatch(channel, tasks, node)', () => {
  it('renders and enqueue jobs and return array of results', async () => {
    const engine = new Engine('test', bot, renderer, queue, [], []);
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

    const engine = new Engine(
      'test',
      bot,
      renderer,
      queue,
      [],
      [middleware1, middleware2, middleware3]
    );

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

    const engine = new Engine('test', bot, renderer, queue, [], [middleware]);

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

    const engine = new Engine('test', bot, renderer, queue, [], [middleware]);

    await expect(engine.dispatch(channel, element, options)).rejects.toThrow(
      'something wrong with the element'
    );

    expect(middleware.mock).toHaveBeenCalledTimes(1);
    expect(queue.executeJobs.mock).not.toHaveBeenCalled();
  });

  it('waits pause', async () => {
    const after = moxy(() => Promise.resolve());
    const tasksWithPause = [
      { type: 'pause', payload: <Machinat.Pause /> },
      { type: 'transmit', payload: [{ id: 1 }, { id: 2 }] },
      { type: 'pause', payload: <Machinat.Pause after={after} /> },
      { type: 'transmit', payload: [{ id: 3 }] },
      { type: 'pause', payload: <Machinat.Pause /> },
    ];

    const engine = new Engine('test', bot, renderer, queue, [], []);

    await expect(
      engine.dispatch(channel, tasksWithPause, element)
    ).resolves.toEqual({
      tasks: tasksWithPause,
      jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
      results: [1, 2, 3],
    });
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
    const tasks = [{ type: 'transmit', payload: [1, 2, 3] }];

    queue.executeJobs.mock.fake(() => Promise.resolve(execResponse));

    const engine = new Engine('test', bot, renderer, queue, [], []);

    let isThrown = false;
    try {
      await engine.dispatch(channel, tasks);
    } catch (err) {
      isThrown = true;
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

    const engine = new Engine('test', bot, renderer, queue, [], [middleware]);

    await expect(
      engine.dispatch(channel, [{ type: 'transmit', payload: [1, 2, 3] }])
    ).resolves.toEqual({ results: [{ something: 'else' }] });
  });
});

describe('#eventIssuer(finalHandler)', () => {
  const metadata = { on: 'spaceship' };
  const event = { found: 'Obi-Wan' };
  const finalHandler = moxy(() => Promise.resolve());

  beforeEach(() => {
    finalHandler.mock.clear();
  });

  it('pass frame to finalHandler', async () => {
    const engine = new Engine('test', bot, renderer, queue, [], []);

    const issueEvent = engine.eventIssuer(finalHandler);

    await Promise.all([
      expect(issueEvent(channel, { id: 1 }, metadata)).resolves.toBe(undefined),
      expect(issueEvent(channel, { id: 2 }, metadata)).resolves.toBe(undefined),
      expect(issueEvent(channel, { id: 3 }, metadata)).resolves.toBe(undefined),
    ]);

    expect(finalHandler.mock).toHaveBeenCalledTimes(3);
    for (let i = 1; i < 4; i += 1) {
      expect(finalHandler.mock).toHaveBeenNthCalledWith(i, {
        platform: 'test',
        bot,
        event: { id: i },
        channel,
        metadata,
        reply: expect.any(Function),
      });
    }
  });

  it('returns what finalHandler returns', async () => {
    const engine = new Engine('test', bot, renderer, queue, [], []);

    const issueEvent = engine.eventIssuer(finalHandler);

    finalHandler.mock.fake(() => Promise.resolve('Roger'));
    await expect(issueEvent(channel, event, metadata)).resolves.toBe('Roger');

    expect(finalHandler.mock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      event,
      channel,
      metadata,
      reply: expect.any(Function),
    });
  });

  it('provide frame.reply(msg, opt) suger', () => {
    const engine = new Engine('test', bot, renderer, queue, [], []);

    const issueEvent = engine.eventIssuer(finalHandler);
    issueEvent(channel, event, metadata);

    const { reply } = finalHandler.mock.calls[0].args[0];

    const frame = { channel, bot };
    const message = "I'll return, I promise.";
    bot.send.mock.fakeReturnValue(['go to cloud city']);

    expect(reply.call(frame, message, options)).toEqual(['go to cloud city']);
    expect(bot.send.mock).toHaveBeenCalledTimes(1);
    expect(bot.send.mock).toHaveBeenCalledWith(channel, message, options);
  });

  it('pass EventFrame through middlewares', async () => {
    finalHandler.mock.fake(() => Promise.resolve('Roger'));

    const expectedFrame = {
      platform: 'test',
      bot,
      event,
      channel,
      metadata,
      reply: expect.any(Function),
    };

    const middleware1 = next => async frame => {
      expect(frame).toEqual(expectedFrame);

      frame.foo = true;
      const result = await next(frame);
      expect(result).toBe('Roger foo bar');

      return `${result} baz`;
    };

    const middleware2 = next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: true });

      frame.bar = true;
      const result = await next(frame);
      expect(result).toBe('Roger foo');

      return `${result} bar`;
    };

    const middleware3 = next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: true, bar: true });

      frame.baz = true;
      const result = await next(frame);
      expect(result).toBe('Roger');

      return `${result} foo`;
    };

    const engine = new Engine(
      'test',
      bot,
      renderer,
      queue,
      [middleware1, middleware2, middleware3],
      []
    );

    const issueEvent = engine.eventIssuer(finalHandler);

    finalHandler.mock.fakeReturnValue('Roger');
    await expect(issueEvent(channel, event, metadata)).resolves.toBe(
      'Roger foo bar baz'
    );

    expect(finalHandler.mock).toHaveBeenCalledWith({
      ...expectedFrame,
      foo: true,
      bar: true,
      baz: true,
    });
  });

  it('throw what middleware thrown and bypass finalHandler', async () => {
    const middleware = () => async () => {
      throw new Error('an X-wing crash!');
    };

    const engine = new Engine('test', bot, renderer, queue, [middleware], []);
    const issueEvent = engine.eventIssuer(finalHandler);

    await expect(issueEvent(channel, event, metadata)).rejects.toThrow(
      'an X-wing crash!'
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });

  it('can bypass the finalHandler in middleware', async () => {
    const middleware = () => async () => 'your droid is being hijacked hahaha';
    const engine = new Engine('test', bot, renderer, queue, [middleware], []);
    const issueEvent = engine.eventIssuer(finalHandler);

    await expect(issueEvent(channel, event, metadata)).resolves.toBe(
      'your droid is being hijacked hahaha'
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });

  it('can catch error in middleware', async () => {
    const middleware1 = next => async frame => {
      try {
        return await next(frame);
      } catch (e) {
        return "Oh, it's just trash compactor bug";
      }
    };

    const middleware2 = () => async () => {
      throw new Error('intruder in the ship!');
    };

    const engine = new Engine(
      'test',
      bot,
      renderer,
      queue,
      [middleware1, middleware2],
      []
    );

    const issueEvent = engine.eventIssuer(finalHandler);
    await expect(issueEvent(channel, event, metadata)).resolves.toBe(
      "Oh, it's just trash compactor bug"
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });
});
