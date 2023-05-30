import { moxy } from '@moxyjs/moxy';
import Queue from '@sociably/core/queue';
import type { WebSocketServer } from '../Server.js';
import Worker from '../Worker.js';
import type { WebSocketJob, WebSocketResult } from '../types.js';

const server = moxy<WebSocketServer<null, null>>({
  dispatch: () => Promise.resolve(null),
  disconnect: () => Promise.resolve(false),
} as never);

const queue = new Queue<WebSocketJob, WebSocketResult>();

beforeEach(() => {
  server.mock.reset();
});

it('subscribe to only one queue', () => {
  const worker = new Worker(server);

  expect(worker.start(queue)).toBe(true);
  expect(worker.start(queue)).toBe(false);
  expect(worker.stop(queue)).toBe(true);
  expect(worker.stop(queue)).toBe(false);
});

it('work', async () => {
  const worker = new Worker(server);
  worker.start(queue);

  const jobs = [
    {
      target: {
        type: 'connection' as const,
        serverId: '#server',
        id: '#conn1',
      },
      values: [{ type: 'foo', payload: '1' }],
    },
    {
      target: { type: 'topic' as const, key: 'somthing' },
      values: [
        { type: 'foo', payload: '2' },
        { type: 'bar', category: 'baz', payload: '3' },
      ],
    },
    {
      target: {
        type: 'connection' as const,
        serverId: '#server',
        id: '#conn2',
      },
      values: [{ type: 'foo', payload: '4' }],
    },
  ];

  const broadcastResult = [
    ['A', 'B', 'C', 'D'],
    ['A', 'B', 'C', 'D'],
    ['A'],
    [],
  ];

  let r = 0;
  server.dispatch.mock.fake(() => broadcastResult[r++]); // eslint-disable-line no-plusplus

  await expect(queue.executeJobs(jobs)).resolves.toMatchSnapshot();

  expect(server.dispatch).toHaveBeenCalledTimes(3);
  for (const [i, { target, values }] of jobs.entries()) {
    expect(server.dispatch).toHaveBeenNthCalledWith(i + 1, {
      target,
      values,
    });
  }
});
