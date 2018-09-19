/* eslint-disable no-await-in-loop, no-loop-func, no-return-assign, no-fallthrough, default-case */
import delay from 'delay';
import Machinat from '../../../machinat';
import MachinatQueue from '../queue';

const makeJobs = n => new Array(n).fill(0).map((_, i) => ({ id: i }));
const makeSuccessJobResult = ids =>
  ids.map(id => ({ success: true, payload: `Success${id}` }));

it('is a constructor', () => {
  expect(() => new MachinatQueue()).not.toThrow();
});

describe('MachinatQueue.prototype', () => {
  let queue;
  const consume = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    queue = new MachinatQueue();

    consume.mockImplementation(async acquired => {
      await delay(10);
      return acquired.map(job => ({
        success: true,
        payload: `Success${job.id}`,
      }));
    });
  });

  afterEach(() => {
    consume.mockClear();
  });

  describe('#enqueue() and #acquire()', () => {
    test('acquire() return undeined if queue is empty', async () => {
      await expect(queue.acquire(1, consume)).resolves.toBe(undefined);
      expect(consume).not.toHaveBeenCalled();
    });

    test('enqueue() 1 jobs and acquire() it', async () => {
      const job = { id: 1 };
      queue.enqueueJob(job);
      expect(queue.length).toBe(1);

      setImmediate(jest.runAllTimers);

      await expect(queue.acquire(1, consume)).resolves.toEqual([
        { success: true, payload: 'Success1' },
      ]);

      expect(queue.length).toBe(0);
      expect(consume).toHaveBeenCalledTimes(1);
      expect(consume).toHaveBeenCalledWith([job]);
    });

    test('acquire() more than queue.length', () => {
      const jobs = makeJobs(2);
      queue.enqueueJob(...jobs);
      expect(queue.length).toBe(2);

      expect(queue.acquire(5, consume)).resolves.toEqual(
        makeSuccessJobResult([0, 1])
      );

      expect(consume).toBeCalledTimes(1);
      expect(consume).toHaveBeenCalledWith(jobs);

      expect(queue.length).toBe(0);
    });

    test('enqueue() jobs and acquire() with error', async () => {
      const jobs = makeJobs(3);
      queue.enqueueJob(...jobs);
      expect(queue.length).toBe(3);

      consume.mockRejectedValueOnce(new Error('fail!'));

      setImmediate(jest.runAllTimers);
      await expect(queue.acquire(3, consume)).rejects.toThrowError('fail!');

      expect(queue.length).toBe(0);
      expect(consume).toHaveBeenCalledTimes(1);
      expect(consume).toHaveBeenCalledWith(jobs);
    });

    test('enqueue() many jobs and acquire() synchronizedly', async () => {
      const jobs = makeJobs(11);
      queue.enqueueJob(...jobs);
      expect(queue.length).toBe(11);

      let i = 0;
      consume.mockImplementation(async acquired => {
        expect(queue.length).toBe(Math.max(0, 11 - (i + 1) * 3));

        return acquired.map(job => ({
          success: true,
          payload: `Success${job.id}`,
        }));
      });

      for (; i < 4; i += 1) {
        setImmediate(jest.runOnlyPendingTimers);

        await expect(queue.acquire(3, consume)).resolves.toEqual(
          makeSuccessJobResult(
            new Array(i === 3 ? 2 : 3).fill(0).map((_, j) => i * 3 + j)
          )
        );
        expect(queue.length).toBe(Math.max(0, 11 - (i + 1) * 3));
      }

      expect(consume).toHaveBeenCalledTimes(4);
      expect(consume).toHaveBeenNthCalledWith(1, jobs.slice(0, 3));
      expect(consume).toHaveBeenNthCalledWith(2, jobs.slice(3, 6));
      expect(consume).toHaveBeenNthCalledWith(3, jobs.slice(6, 9));
      expect(consume).toHaveBeenNthCalledWith(4, jobs.slice(9));

      expect(queue.length).toBe(0);
    });

    test('enqueue() many jobs and acquire() asynchronizedly', async () => {
      const jobs = makeJobs(11);
      queue.enqueueJob(...jobs);
      expect(queue.length).toBe(11);

      let i = 0;
      consume.mockImplementation(async acquired => {
        await delay(100);
        expect(queue.length).toBe(0);

        return acquired.map(job => ({
          success: true,
          payload: `Success${job.id}`,
        }));
      });

      const promises = [];
      for (; queue.length > 0; i += 1) {
        promises.push(queue.acquire(3, consume));
        expect(queue.length).toBe(Math.max(0, 11 - (i + 1) * 3));
      }

      expect(queue.length).toBe(0);

      setImmediate(jest.runAllTimers);
      await expect(Promise.all(promises)).resolves.toEqual([
        makeSuccessJobResult([0, 1, 2]),
        makeSuccessJobResult([3, 4, 5]),
        makeSuccessJobResult([6, 7, 8]),
        makeSuccessJobResult([9, 10]),
      ]);

      expect(consume).toHaveBeenCalledTimes(4);
      expect(consume).toHaveBeenNthCalledWith(1, jobs.slice(0, 3));
      expect(consume).toHaveBeenNthCalledWith(2, jobs.slice(3, 6));
      expect(consume).toHaveBeenNthCalledWith(3, jobs.slice(6, 9));
      expect(consume).toHaveBeenNthCalledWith(4, jobs.slice(9));
    });
  });

  describe('#enqueueJobAndWait()', () => {
    let jobs = makeJobs(9);
    const batch1Resolved = jest.fn();
    const batch2Resolved = jest.fn();
    const batch3Resolved = jest.fn();

    beforeEach(() => {
      jobs = makeJobs(9);
      batch1Resolved.mockClear();
      batch2Resolved.mockClear();
      batch3Resolved.mockClear();
      queue.enqueueJobAndWait(...jobs.slice(0, 3)).then(batch1Resolved);
      queue.enqueueJobAndWait(...jobs.slice(3, 6)).then(batch2Resolved);
      queue.enqueueJobAndWait(...jobs.slice(6, 9)).then(batch3Resolved);
    });

    test('with less job acquire() a time', async () => {
      /* eslint-disable no-return-assign, no-fallthrough, default-case */
      expect(queue.length).toBe(9);

      for (let i = 0; i < 5; i += 1) {
        setImmediate(jest.runOnlyPendingTimers);

        await expect(queue.acquire(2, consume)).resolves.toEqual(
          makeSuccessJobResult(i === 4 ? [8] : [i * 2, i * 2 + 1])
        );
        expect(queue.length).toBe(Math.max(0, 9 - i * 2 - 2));

        expect(consume).toHaveBeenCalledTimes(i + 1);
        expect(consume).toHaveBeenNthCalledWith(
          i + 1,
          jobs.slice(i * 2, i * 2 + 2)
        );

        switch (i) {
          case 0:
            expect(batch1Resolved).not.toHaveBeenCalled();
            break;
          case 1:
            expect(batch2Resolved).not.toHaveBeenCalled();
            expect(batch1Resolved).toHaveBeenCalled();
            break;
          case 2:
          case 3:
            expect(batch3Resolved).not.toHaveBeenCalled();
            expect(batch2Resolved).toHaveBeenCalled();
            break;
          case 4:
            expect(batch3Resolved).toHaveBeenCalled();
            break;
        }
      }

      expect(queue.length).toBe(0);
      [batch1Resolved, batch2Resolved, batch3Resolved].forEach(
        (resolved, i) => {
          const s = i * 3;
          expect(resolved).toHaveBeenCalledWith({
            success: true,
            errors: null,
            batchResult: makeSuccessJobResult([s, s + 1, s + 2]),
          });
        }
      );
    });

    test('with more job acquire() a time', async () => {
      expect(queue.length).toBe(9);

      for (let i = 0; i < 2; i += 1) {
        setImmediate(jest.runOnlyPendingTimers);
        await expect(queue.acquire(5, consume)).resolves.toEqual(
          makeSuccessJobResult(i === 0 ? [0, 1, 2, 3, 4] : [5, 6, 7, 8])
        );

        expect(consume).toHaveBeenCalledTimes(i + 1);
        expect(consume).toHaveBeenNthCalledWith(
          i + 1,
          jobs.slice(i * 5, i * 5 + 5)
        );

        expect(queue.length).toBe(i === 0 ? 4 : 0);
        if (i === 0) {
          expect(batch1Resolved).toHaveBeenCalled();
          expect(batch2Resolved).not.toHaveBeenCalled();
          expect(batch3Resolved).not.toHaveBeenCalled();
        } else {
          expect(batch2Resolved).toHaveBeenCalled();
          expect(batch3Resolved).toHaveBeenCalled();
        }
      }

      expect(queue.length).toBe(0);
      [batch1Resolved, batch2Resolved, batch3Resolved].forEach(
        (resolved, i) => {
          expect(resolved).toHaveBeenCalledWith({
            success: true,
            errors: null,
            batchResult: makeSuccessJobResult([i * 3, i * 3 + 1, i * 3 + 2]),
          });
        }
      );
    });

    test('with acquire() consumption error', async () => {
      expect(queue.length).toBe(9);

      consume.mockImplementation(async acquired => {
        await delay(10);
        if (acquired[0].id === 2 || acquired[0].id === 4) {
          throw new Error('somthing wrong');
        }
        return acquired.map(j => ({
          success: true,
          payload: `Success${j.id}`,
        }));
      });

      for (let i = 0; i < 5; i += 1) {
        setImmediate(jest.runOnlyPendingTimers);

        if (i === 1) {
          await expect(queue.acquire(2, consume)).rejects.toThrow(
            'somthing wrong'
          );
        } else if (i === 4) {
          await expect(queue.acquire(2, consume)).resolves.toBe(undefined);
        } else {
          await expect(queue.acquire(2, consume)).resolves.toEqual(
            makeSuccessJobResult(
              i === 3 ? [8] : i === 2 ? [6, 7] : [i * 2, i * 2 + 1]
            )
          );
        }

        expect(queue.length).toBe(Math.max(0, 9 - (i + (i === 0 ? 1 : 2)) * 2));

        expect(consume).toHaveBeenCalledTimes(i === 4 ? 4 : i + 1);
        if (i < 4)
          expect(consume).toHaveBeenNthCalledWith(
            i + 1,
            i < 2
              ? jobs.slice(i * 2, (i + 1) * 2)
              : jobs.slice((i + 1) * 2, (i + 2) * 2)
          );

        switch (i) {
          case 0:
            expect(batch1Resolved).not.toHaveBeenCalled();
            break;
          case 1:
            expect(batch1Resolved).toHaveBeenCalled();
            expect(batch2Resolved).toHaveBeenCalled();
          case 2:
            expect(batch3Resolved).not.toHaveBeenCalled();
            break;
          case 3:
            expect(batch3Resolved).toHaveBeenCalled();
            break;
        }
      }

      expect(queue.length).toBe(0);

      expect(batch1Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('somthing wrong')],
        batchResult: [
          { success: true, payload: 'Success0' },
          { success: true, payload: 'Success1' },
          undefined,
        ],
      });
      expect(batch2Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('somthing wrong')],
        batchResult: null,
      });
      expect(batch3Resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batchResult: makeSuccessJobResult([6, 7, 8]),
      });
    });

    test('with failed job returned by acquire()', async () => {
      expect(queue.length).toBe(9);

      consume.mockImplementation(async acquired => {
        await delay(10);
        return acquired.map(({ id }) => {
          const success = ![3, 6, 8].includes(id);
          return { success, payload: `${success ? 'Success' : 'Fail'}${id}` };
        });
      });

      setImmediate(jest.runOnlyPendingTimers);
      await expect(queue.acquire(5, consume)).resolves.toEqual([
        { success: true, payload: 'Success0' },
        { success: true, payload: 'Success1' },
        { success: true, payload: 'Success2' },
        { success: false, payload: 'Fail3' },
        { success: true, payload: 'Success4' },
      ]);

      expect(queue.length).toBe(3);
      expect(consume).toHaveBeenCalledTimes(1);
      expect(batch1Resolved).toHaveBeenCalled();
      expect(batch2Resolved).toHaveBeenCalled();
      expect(batch3Resolved).not.toHaveBeenCalled();

      setImmediate(jest.runOnlyPendingTimers);
      await expect(queue.acquire(5, consume)).resolves.toEqual([
        { success: false, payload: 'Fail6' },
        { success: true, payload: 'Success7' },
        { success: false, payload: 'Fail8' },
      ]);

      expect(queue.length).toBe(0);
      expect(consume).toHaveBeenCalledTimes(2);
      expect(batch3Resolved).toHaveBeenCalled();

      expect(consume.mock.calls).toEqual([
        [[{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]],
        [[{ id: 6 }, { id: 7 }, { id: 8 }]],
      ]);

      expect(batch1Resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batchResult: makeSuccessJobResult([0, 1, 2]),
      });
      expect(batch2Resolved).toHaveBeenCalledWith({
        success: false,
        errors: null,
        batchResult: [
          { success: false, payload: 'Fail3' },
          { success: true, payload: 'Success4' },
          undefined,
        ],
      });
      expect(batch3Resolved).toHaveBeenCalledWith({
        success: false,
        errors: null,
        batchResult: [
          { success: false, payload: 'Fail6' },
          { success: true, payload: 'Success7' },
          { success: false, payload: 'Fail8' },
        ],
      });
    });

    test('with less job acquire() asynchronizedly a time', async () => {
      // The fake timers cause all acquirisitions finish at same tick
      // which would break the resolve order assertions.
      jest.useRealTimers();

      const promises = new Array(5).fill(0).map(async (_, i) =>
        queue.acquire(2, async acquired => {
          expect(acquired).toEqual(jobs.slice(i * 2, i * 2 + 2));
          expect(queue.length).toBe(Math.max(0, 9 - i * 2 - 2));

          await delay((5 - i) * 10);

          switch (i) {
            case 4:
            case 3:
              expect(batch3Resolved).not.toHaveBeenCalled();
              break;
            case 2:
            case 1:
              expect(batch3Resolved).toHaveBeenCalled();
              expect(batch2Resolved).not.toHaveBeenCalled();
              break;
            case 0:
              expect(batch2Resolved).toHaveBeenCalled();
              expect(batch1Resolved).not.toHaveBeenCalled();
              break;
          }

          return acquired.map(job => ({
            success: true,
            payload: `Success${job.id}`,
          }));
        })
      );
      expect(queue.length).toBe(0);

      const result = await Promise.all(promises);

      expect(batch1Resolved).toHaveBeenCalled();

      expect(result).toEqual([
        makeSuccessJobResult([0, 1]),
        makeSuccessJobResult([2, 3]),
        makeSuccessJobResult([4, 5]),
        makeSuccessJobResult([6, 7]),
        makeSuccessJobResult([8]),
      ]);
      [batch1Resolved, batch2Resolved, batch3Resolved].forEach(
        (resolved, i) => {
          const b = i * 3;
          expect(resolved).toHaveBeenCalledWith({
            success: true,
            errors: null,
            batchResult: makeSuccessJobResult([b, b + 1, b + 2]),
          });
        }
      );
    });

    test('with more job acquire() asynchronizedly a time', async () => {
      jest.useRealTimers();

      expect(queue.length).toBe(9);

      const promises = new Array(2).fill(0).map(async (_, i) =>
        queue.acquire(5, async acquired => {
          expect(acquired).toEqual(jobs.slice(i * 5, i * 5 + 5));
          expect(queue.length).toBe(Math.max(0, 9 - i * 5 - 5));

          await delay((2 - i) * 10);

          switch (i) {
            case 1:
              expect(batch3Resolved).not.toHaveBeenCalled();
              break;
            case 0:
              expect(batch3Resolved).toHaveBeenCalled();
              expect(batch2Resolved).not.toHaveBeenCalled();
              expect(batch1Resolved).not.toHaveBeenCalled();
              break;
          }

          return acquired.map(job => ({
            success: true,
            payload: `Success${job.id}`,
          }));
        })
      );
      expect(queue.length).toBe(0);

      const result = await Promise.all(promises);
      expect(batch2Resolved).toHaveBeenCalled();
      expect(batch1Resolved).toHaveBeenCalled();

      expect(result).toEqual([
        makeSuccessJobResult([0, 1, 2, 3, 4]),
        makeSuccessJobResult([5, 6, 7, 8]),
      ]);
      [batch1Resolved, batch2Resolved, batch3Resolved].forEach(
        (resolved, i) => {
          const b = i * 3;
          expect(resolved).toHaveBeenCalledWith({
            success: true,
            errors: null,
            batchResult: makeSuccessJobResult([b, b + 1, b + 2]),
          });
        }
      );
    });

    test('with acquire() consumption error asynchronizedly', async () => {
      jest.useRealTimers();

      expect(queue.length).toBe(9);

      const promises = new Array(5).fill(0).map(async (_, i) =>
        queue.acquire(2, async acquired => {
          expect(acquired).toEqual(jobs.slice(i * 2, i * 2 + 2));
          expect(queue.length).toBe(Math.max(0, 9 - (i + 1) * 2));

          await delay((5 - i) * 10);

          switch (i) {
            case 4:
            case 3:
              expect(batch3Resolved).not.toHaveBeenCalled();
              break;
            case 2:
            case 1:
              expect(batch3Resolved).toHaveBeenCalled();
              expect(batch2Resolved).not.toHaveBeenCalled();
              break;
            case 0:
              expect(batch2Resolved).toHaveBeenCalled();
              expect(batch1Resolved).not.toHaveBeenCalled();
              break;
          }

          if ([2, 6, 8].includes(acquired[0].id)) {
            throw new Error('something wrong');
          }

          return acquired.map(job => ({
            success: true,
            payload: `Success${job.id}`,
          }));
        })
      );
      expect(queue.length).toBe(0);

      await expect(promises[4]).rejects.toThrow('something wrong');
      await expect(promises[3]).rejects.toThrow('something wrong');
      await expect(promises[2]).resolves.toEqual(makeSuccessJobResult([4, 5]));
      await expect(promises[1]).rejects.toThrow('something wrong');
      await expect(promises[0]).resolves.toEqual(makeSuccessJobResult([0, 1]));

      expect(batch1Resolved).toHaveBeenCalled();

      expect(batch1Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('something wrong')],
        batchResult: [
          { success: true, payload: 'Success0' },
          { success: true, payload: 'Success1' },
          undefined,
        ],
      });
      expect(batch2Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('something wrong')],
        batchResult: [
          undefined,
          { success: true, payload: 'Success4' },
          { success: true, payload: 'Success5' },
        ],
      });
      expect(batch3Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('something wrong'), new Error('something wrong')],
        batchResult: null,
      });
    });

    test('with failed jobs return by acquire() asynchronizedly', async () => {
      jest.useRealTimers();

      expect(queue.length).toBe(9);

      const promises = new Array(5).fill(0).map(async (_, i) =>
        queue.acquire(2, async acquired => {
          expect(acquired).toEqual(jobs.slice(i * 2, i * 2 + 2));
          expect(queue.length).toBe(Math.max(0, 9 - (i + 1) * 2));

          await delay((5 - i) * 10);

          switch (i) {
            case 4:
            case 3:
              expect(batch3Resolved).not.toHaveBeenCalled();
              break;
            case 2:
            case 1:
              expect(batch3Resolved).toHaveBeenCalled();
              expect(batch2Resolved).not.toHaveBeenCalled();
              break;
            case 0:
              expect(batch2Resolved).toHaveBeenCalled();
              expect(batch1Resolved).not.toHaveBeenCalled();
              break;
          }

          return acquired.map(job => {
            const success = job.id % 2 === 1;
            return {
              success,
              payload: `${success ? 'Success' : 'Fail'}${job.id}`,
            };
          });
        })
      );
      expect(queue.length).toBe(0);

      await expect(Promise.all(promises)).resolves.toEqual([
        [
          { success: false, payload: 'Fail0' },
          { success: true, payload: 'Success1' },
        ],
        [
          { success: false, payload: 'Fail2' },
          { success: true, payload: 'Success3' },
        ],
        [
          { success: false, payload: 'Fail4' },
          { success: true, payload: 'Success5' },
        ],
        [
          { success: false, payload: 'Fail6' },
          { success: true, payload: 'Success7' },
        ],
        [{ success: false, payload: 'Fail8' }],
      ]);

      expect(batch1Resolved).toHaveBeenCalled();

      expect(batch1Resolved).toHaveBeenCalledWith({
        success: false,
        errors: null,
        batchResult: [
          { success: false, payload: 'Fail0' },
          { success: true, payload: 'Success1' },
          { success: false, payload: 'Fail2' },
        ],
      });
      expect(batch2Resolved).toHaveBeenCalledWith({
        success: false,
        errors: null,
        batchResult: [
          { success: true, payload: 'Success3' },
          { success: false, payload: 'Fail4' },
          { success: true, payload: 'Success5' },
        ],
      });
      expect(batch3Resolved).toHaveBeenCalledWith({
        success: false,
        errors: null,
        batchResult: [
          { success: false, payload: 'Fail6' },
          { success: true, payload: 'Success7' },
          { success: false, payload: 'Fail8' },
        ],
      });
    });
  });

  describe('#executeJobSequence()', () => {
    it('works', async () => {
      queue.enqueueJobAndWait = jest.fn((...jobs) => ({
        success: true,
        errors: null,
        batchResult: jobs.map(job => ({
          success: true,
          payload: `Success${job.id}`,
        })),
      }));

      const afterCallback = jest.fn();
      const sequence = [
        [{ id: 1 }, { id: 2 }],
        <Machinat.Immediately after={afterCallback} />,
        [{ id: 3 }, { id: 4 }],
        <Machinat.Immediately after={afterCallback} />,
        [{ id: 5 }],
      ];

      const result = await queue.executeJobSequence(sequence);

      expect(result).toEqual({
        success: true,
        errors: null,
        batchResult: [
          { success: true, payload: 'Success1' },
          { success: true, payload: 'Success2' },
          { success: true, payload: 'Success3' },
          { success: true, payload: 'Success4' },
          { success: true, payload: 'Success5' },
        ],
      });

      expect(afterCallback).toBeCalledTimes(2);

      const { enqueueJobAndWait } = queue;
      expect(enqueueJobAndWait).toBeCalledTimes(3);
      expect(enqueueJobAndWait).toHaveBeenNthCalledWith(
        1,
        ...[{ id: 1 }, { id: 2 }]
      );
      expect(enqueueJobAndWait).toHaveBeenNthCalledWith(
        2,
        ...[{ id: 3 }, { id: 4 }]
      );
      expect(enqueueJobAndWait).toHaveBeenNthCalledWith(3, { id: 5 });
    });

    test('execute with fail job', async () => {
      queue.enqueueJobAndWait = jest.fn((...jobs) => ({
        success: jobs[0].id === 0,
        errors: null,
        batchResult: jobs.map(job => {
          const success = ![3, 5].includes(job.id);
          return {
            success,
            payload: `${success ? 'Success' : 'Fail'}${job.id}`,
          };
        }),
      }));

      const afterCallback = jest.fn();
      const sequence = [
        [{ id: 0 }, { id: 1 }, { id: 2 }],
        <Machinat.Immediately after={afterCallback} />,
        [{ id: 3 }, { id: 4 }, { id: 5 }],
        <Machinat.Immediately after={afterCallback} />,
        [{ id: 5 }, { id: 6 }],
      ];

      const result = await queue.executeJobSequence(sequence);
      expect(result).toEqual({
        success: false,
        errors: null,
        batchResult: [
          { success: true, payload: 'Success0' },
          { success: true, payload: 'Success1' },
          { success: true, payload: 'Success2' },
          { success: false, payload: 'Fail3' },
          { success: true, payload: 'Success4' },
          { success: false, payload: 'Fail5' },
        ],
      });

      expect(afterCallback).toHaveBeenCalledTimes(1);

      const { enqueueJobAndWait } = queue;
      expect(enqueueJobAndWait).toBeCalledTimes(2);
      expect(enqueueJobAndWait).toHaveBeenNthCalledWith(
        1,
        ...[{ id: 0 }, { id: 1 }, { id: 2 }]
      );
      expect(enqueueJobAndWait).toHaveBeenNthCalledWith(
        2,
        ...[{ id: 3 }, { id: 4 }, { id: 5 }]
      );
    });
  });
});
