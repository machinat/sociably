import moxy from 'moxy';
import Queue from 'machinat-queue';
import Worker from '../worker';

const distributor = moxy({
  broadcast: () => Promise.resolve(null),
  connectSocket: () => Promise.resolve(false),
  disconnectSocket: () => Promise.resolve(false),
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
    { uid: 'websocket:1:2:3', type: 'foo', payload: '1' },
    { uid: 'websocket:1:2:3', type: 'foo', subtype: 'bar', payload: '2' },
    {
      uid: 'websocket:1:2:3',
      type: 'foo',
      subtype: 'baz',
      payload: '3',
      whitelist: ['A', 'B', 'C'],
      blacklist: ['B', 'C', 'D'],
    },
    { uid: 'websocket:x:x:x', type: 'foo', payload: '4' },
  ];

  const broadcastResult = [
    ['A', 'B', 'C', 'D'],
    ['A', 'B', 'C', 'D'],
    ['A'],
    null,
  ];

  let i = 0;
  distributor.broadcast.mock.fake(() => broadcastResult[i++]); // eslint-disable-line no-plusplus

  await expect(queue.executeJobs(jobs)).resolves.toMatchInlineSnapshot(`
Object {
  "batch": Array [
    Object {
      "error": undefined,
      "job": Object {
        "payload": "1",
        "type": "foo",
        "uid": "websocket:1:2:3",
      },
      "result": Object {
        "sockets": Array [
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
        "payload": "2",
        "subtype": "bar",
        "type": "foo",
        "uid": "websocket:1:2:3",
      },
      "result": Object {
        "sockets": Array [
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
        "payload": "3",
        "subtype": "baz",
        "type": "foo",
        "uid": "websocket:1:2:3",
        "whitelist": Array [
          "A",
          "B",
          "C",
        ],
      },
      "result": Object {
        "sockets": Array [
          "A",
        ],
      },
      "success": true,
    },
    Object {
      "error": undefined,
      "job": Object {
        "payload": "4",
        "type": "foo",
        "uid": "websocket:x:x:x",
      },
      "result": Object {
        "sockets": null,
      },
      "success": true,
    },
  ],
  "errors": null,
  "success": true,
}
`);

  expect(distributor.broadcast.mock).toHaveBeenCalledTimes(4);
  expect(distributor.broadcast.mock).toHaveBeenCalledWith(jobs[0]);
  expect(distributor.broadcast.mock).toHaveBeenCalledWith(jobs[1]);
  expect(distributor.broadcast.mock).toHaveBeenCalledWith(jobs[2]);
  expect(distributor.broadcast.mock).toHaveBeenCalledWith(jobs[3]);
});
