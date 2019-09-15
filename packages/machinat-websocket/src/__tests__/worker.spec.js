import moxy from 'moxy';
import Queue from 'machinat-queue';
import Worker from '../worker';

const distributor = moxy({
  broadcast: () => Promise.resolve(null),
  disconnect: () => Promise.resolve(false),
});

beforeEach(() => {
  distributor.mock.reset();
});

it('subscribe to only one queue', () => {
  const queue = new Queue();
  const worker = new Worker(distributor);

  expect(worker.start(queue)).toBe(true);
  expect(worker.start(queue)).toBe(false);
  expect(worker.stop(queue)).toBe(true);
  expect(worker.stop(queue)).toBe(false);
});

it('work', async () => {
  const queue = new Queue();
  const worker = new Worker(distributor);
  worker.start(queue);

  const jobs = [
    {
      scope: { type: 'connection', connection: {} },
      order: { type: 'foo', payload: '1' },
    },
    {
      scope: { type: 'topic', name: 'somthing' },
      order: { type: 'foo', subtype: 'bar', payload: '2' },
    },
    {
      scope: { type: 'topic', name: 'somthing else', id: 1 },
      order: {
        type: 'foo',
        subtype: 'baz',
        payload: '3',
        only: ['A', 'B', 'C'],
        except: ['B', 'C', 'D'],
      },
    },
    {
      scope: { type: 'user', user: { id: 'jojo' } },
      order: { type: 'foo', payload: '4' },
    },
  ];

  const broadcastResult = [
    ['A', 'B', 'C', 'D'],
    ['A', 'B', 'C', 'D'],
    ['A'],
    null,
  ];

  let r = 0;
  distributor.broadcast.mock.fake(() => broadcastResult[r++]); // eslint-disable-line no-plusplus

  await expect(queue.executeJobs(jobs)).resolves.toMatchInlineSnapshot(`
          Object {
            "batch": Array [
              Object {
                "error": undefined,
                "job": Object {
                  "order": Object {
                    "payload": "1",
                    "type": "foo",
                  },
                  "scope": Object {
                    "connection": Object {},
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
                  "order": Object {
                    "payload": "2",
                    "subtype": "bar",
                    "type": "foo",
                  },
                  "scope": Object {
                    "name": "somthing",
                    "type": "topic",
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
                  "order": Object {
                    "except": Array [
                      "B",
                      "C",
                      "D",
                    ],
                    "only": Array [
                      "A",
                      "B",
                      "C",
                    ],
                    "payload": "3",
                    "subtype": "baz",
                    "type": "foo",
                  },
                  "scope": Object {
                    "id": 1,
                    "name": "somthing else",
                    "type": "topic",
                  },
                },
                "result": Object {
                  "connections": Array [
                    "A",
                  ],
                },
                "success": true,
              },
              Object {
                "error": undefined,
                "job": Object {
                  "order": Object {
                    "payload": "4",
                    "type": "foo",
                  },
                  "scope": Object {
                    "type": "user",
                    "user": Object {
                      "id": "jojo",
                    },
                  },
                },
                "result": Object {
                  "connections": null,
                },
                "success": true,
              },
            ],
            "errors": null,
            "success": true,
          }
        `);

  expect(distributor.broadcast.mock).toHaveBeenCalledTimes(4);
  for (const [i, { scope, order }] of jobs.entries()) {
    expect(distributor.broadcast.mock).toHaveBeenNthCalledWith(
      i + 1,
      scope,
      order
    );
  }
});
