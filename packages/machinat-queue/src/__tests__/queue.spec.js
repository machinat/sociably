/* eslint-disable no-await-in-loop, no-loop-func, no-return-assign, no-fallthrough, default-case */
import moxy from 'moxy';
import delay from 'delay';
import MachinatQueue from '../queue';

const makeJobs = n => new Array(n).fill(0).map((_, i) => ({ id: i }));

const successJobResponses = ids =>
  ids.map(id => ({
    success: true,
    result: `Success${id}`,
    error: undefined,
    job: { id },
  }));

const failedJobResponses = ids =>
  ids.map(id => ({
    success: false,
    result: `Fail${id}`,
    error: new Error(`Fail${id}`),
    job: { id },
  }));

const nextTick = () => new Promise(setImmediate);

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
      return successJobResponses(acquired.map(job => job.id));
    });
  });

  afterEach(() => {
    consume.mockClear();
  });

  describe('#enqueueJobs() and #acquire()', () => {
    test('acquire() return undefined if queue is empty', async () => {
      await expect(queue.acquire(1, consume)).resolves.toBe(undefined);
      expect(consume).not.toHaveBeenCalled();
    });

    test('enqueueJobs() 1 jobs and acquire() it', async () => {
      const job = { id: 1 };
      queue.enqueueJobs(job);
      expect(queue.length).toBe(1);

      setImmediate(jest.runAllTimers);

      await expect(queue.acquire(1, consume)).resolves.toEqual(
        successJobResponses([1])
      );

      expect(queue.length).toBe(0);
      expect(consume).toHaveBeenCalledTimes(1);
      expect(consume).toHaveBeenCalledWith([job]);
    });

    test('acquire() more than queue.length', () => {
      const jobs = makeJobs(2);
      queue.enqueueJobs(...jobs);
      expect(queue.length).toBe(2);

      expect(queue.acquire(5, consume)).resolves.toEqual(
        successJobResponses([0, 1])
      );

      expect(consume).toBeCalledTimes(1);
      expect(consume).toHaveBeenCalledWith(jobs);

      expect(queue.length).toBe(0);
    });

    test('enqueueJobs() jobs and acquire() with error', async () => {
      const jobs = makeJobs(3);
      queue.enqueueJobs(...jobs);
      expect(queue.length).toBe(3);

      consume.mockRejectedValueOnce(new Error('fail!'));

      setImmediate(jest.runAllTimers);
      await expect(queue.acquire(3, consume)).rejects.toThrowError('fail!');

      expect(queue.length).toBe(0);
      expect(consume).toHaveBeenCalledTimes(1);
      expect(consume).toHaveBeenCalledWith(jobs);
    });

    test('enqueueJobs() many jobs and acquire() synchronizedly', async () => {
      const jobs = makeJobs(11);
      queue.enqueueJobs(...jobs);
      expect(queue.length).toBe(11);

      let i = 0;
      consume.mockImplementation(async acquired => {
        expect(queue.length).toBe(Math.max(0, 11 - (i + 1) * 3));

        return successJobResponses(acquired.map(job => job.id));
      });

      for (; i < 4; i += 1) {
        setImmediate(jest.runOnlyPendingTimers);

        await expect(queue.acquire(3, consume)).resolves.toEqual(
          successJobResponses(
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

    test('enqueueJobs() many jobs and acquire() asynchronizedly', async () => {
      const jobs = makeJobs(11);
      queue.enqueueJobs(...jobs);
      expect(queue.length).toBe(11);

      let i = 0;
      consume.mockImplementation(async acquired => {
        await delay(100);
        expect(queue.length).toBe(0);

        return successJobResponses(acquired.map(job => job.id));
      });

      const promises = [];
      for (; queue.length > 0; i += 1) {
        promises.push(queue.acquire(3, consume));
        expect(queue.length).toBe(Math.max(0, 11 - (i + 1) * 3));
      }

      expect(queue.length).toBe(0);

      setImmediate(jest.runAllTimers);
      await expect(Promise.all(promises)).resolves.toEqual([
        successJobResponses([0, 1, 2]),
        successJobResponses([3, 4, 5]),
        successJobResponses([6, 7, 8]),
        successJobResponses([9, 10]),
      ]);

      expect(consume).toHaveBeenCalledTimes(4);
      expect(consume).toHaveBeenNthCalledWith(1, jobs.slice(0, 3));
      expect(consume).toHaveBeenNthCalledWith(2, jobs.slice(3, 6));
      expect(consume).toHaveBeenNthCalledWith(3, jobs.slice(6, 9));
      expect(consume).toHaveBeenNthCalledWith(4, jobs.slice(9));
    });
  });

  describe('#executeJobs()', () => {
    let jobs = makeJobs(9);
    const batch1Resolved = jest.fn();
    const batch2Resolved = jest.fn();
    const batch3Resolved = jest.fn();

    beforeEach(() => {
      jobs = makeJobs(9);
      batch1Resolved.mockClear();
      batch2Resolved.mockClear();
      batch3Resolved.mockClear();
      queue.executeJobs(...jobs.slice(0, 3)).then(batch1Resolved);
      queue.executeJobs(...jobs.slice(3, 6)).then(batch2Resolved);
      queue.executeJobs(...jobs.slice(6, 9)).then(batch3Resolved);
    });

    test('with less job acquire() a time', async () => {
      /* eslint-disable no-return-assign, no-fallthrough, default-case */
      expect(queue.length).toBe(9);

      for (let i = 0; i < 5; i += 1) {
        setImmediate(jest.runOnlyPendingTimers);

        await expect(queue.acquire(2, consume)).resolves.toEqual(
          successJobResponses(i === 4 ? [8] : [i * 2, i * 2 + 1])
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
            batch: successJobResponses([s, s + 1, s + 2]),
          });
        }
      );
    });

    test('with more job acquire() a time', async () => {
      expect(queue.length).toBe(9);

      for (let i = 0; i < 2; i += 1) {
        setImmediate(jest.runOnlyPendingTimers);
        await expect(queue.acquire(5, consume)).resolves.toEqual(
          successJobResponses(i === 0 ? [0, 1, 2, 3, 4] : [5, 6, 7, 8])
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
            batch: successJobResponses([i * 3, i * 3 + 1, i * 3 + 2]),
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
        return successJobResponses(acquired.map(j => j.id));
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
            successJobResponses(
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
        batch: [...successJobResponses([0, 1]), undefined],
      });
      expect(batch2Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('somthing wrong')],
        batch: null,
      });
      expect(batch3Resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batch: successJobResponses([6, 7, 8]),
      });
    });

    test('with failed job returned by acquire()', async () => {
      expect(queue.length).toBe(9);

      consume.mockImplementation(async acquired => {
        await delay(10);
        return acquired.map(job => {
          const success = ![3, 6, 8].includes(job.id);

          const [response] = success
            ? successJobResponses([job.id])
            : failedJobResponses([job.id]);
          return response;
        });
      });

      setImmediate(jest.runOnlyPendingTimers);
      await expect(queue.acquire(5, consume)).resolves.toEqual([
        ...successJobResponses([0, 1, 2]),
        ...failedJobResponses([3]),
        ...successJobResponses([4]),
      ]);

      expect(queue.length).toBe(3);
      expect(consume).toHaveBeenCalledTimes(1);
      expect(batch1Resolved).toHaveBeenCalled();
      expect(batch2Resolved).toHaveBeenCalled();
      expect(batch3Resolved).not.toHaveBeenCalled();

      setImmediate(jest.runOnlyPendingTimers);
      await expect(queue.acquire(5, consume)).resolves.toEqual([
        ...failedJobResponses([6]),
        ...successJobResponses([7]),
        ...failedJobResponses([8]),
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
        batch: successJobResponses([0, 1, 2]),
      });
      expect(batch2Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('Fail3')],
        batch: [
          ...failedJobResponses([3]),
          ...successJobResponses([4]),
          undefined,
        ],
      });
      expect(batch3Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('Fail6'), new Error('Fail8')],
        batch: [
          ...failedJobResponses([6]),
          ...successJobResponses([7]),
          ...failedJobResponses([8]),
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

          return successJobResponses(acquired.map(job => job.id));
        })
      );
      expect(queue.length).toBe(0);

      const result = await Promise.all(promises);

      expect(batch1Resolved).toHaveBeenCalled();

      expect(result).toEqual([
        successJobResponses([0, 1]),
        successJobResponses([2, 3]),
        successJobResponses([4, 5]),
        successJobResponses([6, 7]),
        successJobResponses([8]),
      ]);
      [batch1Resolved, batch2Resolved, batch3Resolved].forEach(
        (resolved, i) => {
          const b = i * 3;
          expect(resolved).toHaveBeenCalledWith({
            success: true,
            errors: null,
            batch: successJobResponses([b, b + 1, b + 2]),
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

          return successJobResponses(acquired.map(job => job.id));
        })
      );
      expect(queue.length).toBe(0);

      const result = await Promise.all(promises);
      expect(batch2Resolved).toHaveBeenCalled();
      expect(batch1Resolved).toHaveBeenCalled();

      expect(result).toEqual([
        successJobResponses([0, 1, 2, 3, 4]),
        successJobResponses([5, 6, 7, 8]),
      ]);
      [batch1Resolved, batch2Resolved, batch3Resolved].forEach(
        (resolved, i) => {
          const b = i * 3;
          expect(resolved).toHaveBeenCalledWith({
            success: true,
            errors: null,
            batch: successJobResponses([b, b + 1, b + 2]),
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

          await delay((5 - i) * 100);

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

          return successJobResponses(acquired.map(job => job.id));
        })
      );
      expect(queue.length).toBe(0);

      await expect(promises[4]).rejects.toThrow('something wrong');
      await expect(promises[3]).rejects.toThrow('something wrong');
      await expect(promises[2]).resolves.toEqual(successJobResponses([4, 5]));
      await expect(promises[1]).rejects.toThrow('something wrong');
      await expect(promises[0]).resolves.toEqual(successJobResponses([0, 1]));

      expect(batch1Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('something wrong')],
        batch: [...successJobResponses([0, 1]), undefined],
      });
      expect(batch2Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('something wrong')],
        batch: [undefined, ...successJobResponses([4, 5])],
      });
      expect(batch3Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('something wrong'), new Error('something wrong')],
        batch: null,
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
              result: `${success ? 'Success' : 'Fail'}${job.id}`,
              error: success ? undefined : new Error(`Fail${job.id}`),
              job,
            };
          });
        })
      );
      expect(queue.length).toBe(0);

      await expect(Promise.all(promises)).resolves.toEqual([
        [...failedJobResponses([0]), ...successJobResponses([1])],
        [...failedJobResponses([2]), ...successJobResponses([3])],
        [...failedJobResponses([4]), ...successJobResponses([5])],
        [...failedJobResponses([6]), ...successJobResponses([7])],
        [...failedJobResponses([8])],
      ]);

      expect(batch1Resolved).toHaveBeenCalled();

      expect(batch1Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('Fail2'), new Error('Fail0')],
        batch: [
          ...failedJobResponses([0]),
          ...successJobResponses([1]),
          ...failedJobResponses([2]),
        ],
      });
      expect(batch2Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('Fail4')],
        batch: [
          ...successJobResponses([3]),
          ...failedJobResponses([4]),
          ...successJobResponses([5]),
        ],
      });
      expect(batch3Resolved).toHaveBeenCalledWith({
        success: false,
        errors: [new Error('Fail8'), new Error('Fail6')],
        batch: [
          ...failedJobResponses([6]),
          ...successJobResponses([7]),
          ...failedJobResponses([8]),
        ],
      });
    });
  });
});
