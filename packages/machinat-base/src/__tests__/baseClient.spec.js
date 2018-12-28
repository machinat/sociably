import moxy from 'moxy';
import Queue from 'machinat-queue';
import Renderer from 'machinat-renderer';

import Machinat from 'machinat';

import Client from '../baseClient';
import { SendError } from '../error';

const message = (
  <>
    <a id={1} />
    <b id={2} />
    <c id={3} />
  </>
);
const thread = { some: 'body' };
const options = { foo: 'bar' };

const actions = [
  {
    isSeparator: false,
    element: <a id={1} />,
    value: '__RENDERED_GENERAL_1__',
    path: '$::0',
  },
  {
    isSeparator: false,
    element: <b id={2} />,
    value: '__RENDERED_GENERAL_2__',
    path: '$::1',
  },
  {
    isSeparator: false,
    element: <c id={3} />,
    value: '__RENDERED_GENERAL_3__',
    path: '$::2',
  },
];

const queue = moxy(new Queue(), {
  excludeProps: ['_waitedRequets', '_queuedJobs'],
});
queue.executeJobs.mock.fake((...jobs) =>
  Promise.resolve({
    success: true,
    batch: jobs.map(job => ({ job, success: true, result: job.id })),
  })
);

const createJobs = moxy(acts =>
  acts.map(act => ({ id: act.element.props.id }))
);

const renderer = moxy(new Renderer('test', {}));
renderer.renderRoot.mock.fakeReturnValue(actions);

beforeEach(() => {
  queue.executeJobs.mock.clear();
  createJobs.mock.clear();
  renderer.renderRoot.mock.clear();
});

it('renders and enqueue jobs', async () => {
  const client = new Client('test', queue, renderer, createJobs);

  await expect(client._sendImpl(thread, message, options)).resolves.toEqual({
    message,
    actions,
    jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
    results: [1, 2, 3],
  });

  expect(renderer.renderRoot.mock).toHaveBeenCalledWith(message, {
    platform: 'test',
  });

  expect(createJobs.mock).toHaveBeenCalledWith(actions, thread, options);

  expect(queue.executeJobs.mock) // prettier-ignore
    .toHaveBeenCalledWith({ id: 1 }, { id: 2 }, { id: 3 });
});

it('pass sending context through middlewares', async () => {
  const client = new Client('test', queue, renderer, createJobs);

  const expectedContext = {
    platform: 'test',
    thread,
    options,
    renderer,
    message,
    actions,
  };

  const expectedResponse = {
    message,
    actions,
    jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
    results: [1, 2, 3],
  };

  const middleware1 = moxy(async (context, next) => {
    expect(context).toEqual(expectedContext);

    context.foo = 'bar';
    const result = await next();

    expect(result).toEqual({ ...expectedResponse, foo: 'baz' });

    return result;
  });

  const middleware2 = moxy(async (context, next) => {
    expect(context).toEqual({ ...expectedContext, foo: 'bar' });

    const result = await next();

    expect(result).toEqual(expectedResponse);

    return { ...result, foo: 'baz' };
  });

  client.use(middleware1).use(middleware2);

  await expect(client._sendImpl(thread, message, options)).resolves.toEqual({
    ...expectedResponse,
    foo: 'baz',
  });

  expect(renderer.renderRoot.mock) // prettier-ignore
    .toHaveBeenCalledWith(message, { platform: 'test' });

  expect(createJobs.mock).toHaveBeenCalledWith(actions, thread, options);

  expect(middleware1.mock).toHaveBeenCalled();
  expect(middleware2.mock).toHaveBeenCalled();

  expect(queue.executeJobs.mock) // prettier-ignore
    .toHaveBeenCalledWith({ id: 1 }, { id: 2 }, { id: 3 });
});

it('waits separator', async () => {
  const after = moxy();
  const pausedActions = [
    {
      isSeparator: false,
      element: <a id={1} />,
      value: '__RENDERED_GENERAL_1__',
      path: '$::0',
    },
    {
      isSeparator: true,
      element: <Machinat.Immediate />,
      path: '$::1',
    },
    {
      isSeparator: false,
      element: <b id={2} />,
      value: '__RENDERED_GENERAL_2__',
      path: '$::2',
    },
    {
      isSeparator: true,
      element: <Machinat.Immediate after={after} />,
      path: '$::3',
    },
    {
      isSeparator: false,
      element: <b id={3} />,
      value: '__RENDERED_GENERAL_3__',
      path: '$::4',
    },
  ];
  renderer.renderRoot.mock.fakeReturnValue(pausedActions);

  const client = new Client('test', queue, renderer, createJobs);

  await expect(client._sendImpl(thread, message, options)).resolves.toEqual({
    message,
    actions: pausedActions,
    jobs: [{ id: 1 }, { id: 2 }, { id: 3 }],
    results: [1, 2, 3],
  });

  expect(renderer.renderRoot.mock) // prettier-ignore
    .toHaveBeenCalledWith(message, { platform: 'test' });

  expect(createJobs.mock) // align-helper
    .toHaveBeenNthCalledWith(1, [pausedActions[0]], thread, options);
  expect(createJobs.mock) // align-helper
    .toHaveBeenNthCalledWith(2, [pausedActions[2]], thread, options);
  expect(createJobs.mock) // align-helper
    .toHaveBeenNthCalledWith(3, [pausedActions[4]], thread, options);

  expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(1, { id: 1 });
  expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(2, { id: 2 });
  expect(queue.executeJobs.mock).toHaveBeenNthCalledWith(3, { id: 3 });
});

it('throws if execution fail', async () => {
  const err1 = new Error('bad thing 1');
  const err2 = new Error('bad thing 2');
  const response = {
    success: false,
    errors: [err1, err2],
    batch: [{ some: 'success thing' }],
  };

  queue.executeJobs.mock.fake(() => Promise.resolve(response));

  const client = new Client('test', queue, renderer, createJobs);

  try {
    await client._sendImpl(thread, message);
  } catch (err) {
    expect(err.response).toEqual(response);

    expect(err).toBeInstanceOf(SendError);
    expect(err.message).toEqual(
      expect.stringContaining('Errors happen while sending:')
    );

    expect(err.message).toEqual(expect.stringContaining(err1.message));
    expect(err.message).toEqual(expect.stringContaining(err2.message));
  }
});

it('can catch error in middleware', async () => {
  queue.executeJobs.mock.fake(() => Promise.reject(new Error('bad thing!')));

  const client = new Client('test', queue, renderer, createJobs);

  const middleware = async (context, next) => {
    try {
      return await next();
    } catch (e) {
      return { something: 'else' };
    }
  };

  client.use(middleware);

  await expect(client._sendImpl(thread, message)).resolves.toEqual({
    something: 'else',
  });
});
