import moxy from '@moxyjs/moxy';
import Queue from '@machinat/core/queue';
import Worker from '../worker';

const transmitter = moxy({
  dispatch: () => Promise.resolve(null),
  disconnect: () => Promise.resolve(false),
});

beforeEach(() => {
  transmitter.mock.reset();
});

it('subscribe to only one queue', () => {
  const queue = new Queue();
  const worker = new Worker(transmitter);

  expect(worker.start(queue)).toBe(true);
  expect(worker.start(queue)).toBe(false);
  expect(worker.stop(queue)).toBe(true);
  expect(worker.stop(queue)).toBe(false);
});

it('work', async () => {
  const queue = new Queue();
  const worker = new Worker(transmitter);
  worker.start(queue);

  const jobs = [
    {
      target: {
        type: 'connection',
        serverId: '#server',
        connectionId: '#conn',
      },
      events: [{ type: 'foo', payload: '1' }],
    },
    {
      target: { type: 'topic', name: 'somthing' },
      events: [
        { type: 'foo', payload: '2' },
        { type: 'bar', category: 'baz', payload: '3' },
      ],
      whitelist: ['A', 'B', 'C'],
      blacklist: ['B', 'C', 'D'],
    },

    {
      target: { type: 'user', userUId: 'jojo_doe' },
      events: [{ type: 'foo', payload: '4' }],
    },
  ];

  const broadcastResult = [
    ['A', 'B', 'C', 'D'],
    ['A', 'B', 'C', 'D'],
    ['A'],
    null,
  ];

  let r = 0;
  transmitter.dispatch.mock.fake(() => broadcastResult[r++]); // eslint-disable-line no-plusplus

  await expect(queue.executeJobs(jobs)).resolves.toMatchInlineSnapshot(`
          Object {
            "batch": Array [
              Object {
                "error": undefined,
                "job": Object {
                  "events": Array [
                    Object {
                      "payload": "1",
                      "type": "foo",
                    },
                  ],
                  "target": Object {
                    "connectionId": "#conn",
                    "serverId": "#server",
                    "type": "connection",
                  },
                },
                "result": Object {
                  "connections": Array [
                    "A",
                    "B",
                    "C",
                    "D",
                  ],
                },
                "success": true,
              },
              Object {
                "error": undefined,
                "job": Object {
                  "blacklist": Array [
                    "B",
                    "C",
                    "D",
                  ],
                  "events": Array [
                    Object {
                      "payload": "2",
                      "type": "foo",
                    },
                    Object {
                      "category": "baz",
                      "payload": "3",
                      "type": "bar",
                    },
                  ],
                  "target": Object {
                    "name": "somthing",
                    "type": "topic",
                  },
                  "whitelist": Array [
                    "A",
                    "B",
                    "C",
                  ],
                },
                "result": Object {
                  "connections": Array [
                    "A",
                    "B",
                    "C",
                    "D",
                  ],
                },
                "success": true,
              },
              Object {
                "error": undefined,
                "job": Object {
                  "events": Array [
                    Object {
                      "payload": "4",
                      "type": "foo",
                    },
                  ],
                  "target": Object {
                    "type": "user",
                    "userUId": "jojo_doe",
                  },
                },
                "result": Object {
                  "connections": Array [
                    "A",
                  ],
                },
                "success": true,
              },
            ],
            "errors": null,
            "success": true,
          }
        `);

  expect(transmitter.dispatch.mock).toHaveBeenCalledTimes(3);
  for (const [i, { target, events, blacklist, whitelist }] of jobs.entries()) {
    expect(transmitter.dispatch.mock).toHaveBeenNthCalledWith(i + 1, {
      target,
      events,
      blacklist,
      whitelist,
    });
  }
});
