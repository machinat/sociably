/* eslint-disable no-await-in-loop, no-loop-func */
import delay from 'delay';
import MachinatQueue from '../queue';

it('is a constructor', () => {
  expect(() => new MachinatQueue()).not.toThrow();
});

describe('MachinatQueue instance', () => {
  let queue;
  beforeEach(() => {
    queue = new MachinatQueue();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('enqueue one jobs and acquire it', async () => {
    const job = { id: 1 };
    queue.enqueueJob(job);
    expect(queue.length).toBe(1);

    let called = false;
    const promise = queue.acquire(1, async jobs => {
      called = true;
      expect(jobs.length).toBe(1);
      expect(jobs[0]).toBe(job);
      await delay(100);
      return [{ success: true, payload: 'Success' }];
    });

    setImmediate(jest.runAllTimers);

    await expect(promise).resolves.toEqual([
      { success: true, payload: 'Success' },
    ]);
    expect(queue.length).toBe(0);
    expect(called).toBe(true);
  });

  test('enque jobs and acquire with failure', async () => {
    const jobs = [{ id: 1 }, { id: 2 }, { id: 3 }];
    queue.enqueueJob(...jobs);
    expect(queue.length).toBe(3);

    let called = false;
    const promise = queue.acquire(3, async acquired => {
      called = true;
      expect(queue.length).toBe(0);
      expect(acquired.length).toBe(3);
      expect(acquired).toEqual(jobs);
      await delay(100);
      throw new Error('fail!');
    });

    setImmediate(jest.runAllTimers);

    await expect(promise).rejects.toThrowError('fail!');
    expect(queue.length).toBe(0);
    expect(called).toBe(true);
  });

  test('enqueue many jobs and acquire synchronizedly', async () => {
    const jobs = new Array(11).fill(null).map((_, i) => ({ id: i }));
    queue.enqueueJob(...jobs);
    expect(queue.length).toBe(11);

    let count = 0;
    for (let i = 0; i < 4; i += 1) {
      const promise = queue.acquire(3, async acquired => {
        expect(acquired.length).toBe(11 - count < 3 ? 11 - count : 3);
        acquired.forEach(job => {
          expect(job).toEqual({ id: count });
          count += 1;
        });

        await delay(100);
        return acquired.map(() => ({ success: true, payload: 'Success' }));
      });

      setImmediate(jest.runOnlyPendingTimers);

      await expect(promise).resolves.toEqual(
        new Array(i === 3 ? 2 : 3).fill({
          success: true,
          payload: 'Success',
        })
      );
      expect(queue.length).toBe(11 - count);
    }

    expect(queue.length).toBe(0);
    expect(count).toBe(11);
  });

  test('enqueue many jobs and acquire asynchronizedly', async () => {
    const jobs = new Array(11).fill(null).map((_, i) => ({ id: i }));
    queue.enqueueJob(...jobs);
    expect(queue.length).toBe(11);

    let count = 0;
    const promises = [];
    while (queue.length > 0) {
      promises.push(
        queue.acquire(3, async acquired => {
          expect(acquired.length).toBe(11 - count < 3 ? 11 - count : 3);
          acquired.forEach(job => {
            expect(job).toEqual({ id: count });
            count += 1;
          });

          await delay(100);
          return acquired.map(() => ({ success: true, payload: 'Success' }));
        })
      );
      expect(queue.length).toBe(11 - count);
    }

    expect(queue.length).toBe(0);

    setImmediate(jest.runAllTimers);
    await expect(Promise.all(promises)).resolves.toEqual(
      new Array(4).fill(null).map((_, i) =>
        new Array(i === 3 ? 2 : 3).fill({
          success: true,
          payload: 'Success',
        })
      )
    );
    expect(count).toBe(11);
  });

  test('enqueueJobAndWait with less job acquire a time', async () => {
    /* eslint-disable no-return-assign, no-fallthrough, default-case */
    const jobs = new Array(9).fill(null).map((_, i) => ({ id: i }));
    const batch1 = queue.enqueueJobAndWait(...jobs.slice(0, 3));
    const batch2 = queue.enqueueJobAndWait(...jobs.slice(3, 6));
    const batch3 = queue.enqueueJobAndWait(...jobs.slice(6, 9));
    expect(queue.length).toBe(9);

    let batch1Resolved = false;
    let batch2Resolved = false;
    let batch3Resolved = false;
    batch1.then(() => (batch1Resolved = true));
    batch2.then(() => (batch2Resolved = true));
    batch3.then(() => (batch3Resolved = true));

    for (let i = 0; i < 5; i += 1) {
      setImmediate(jest.runOnlyPendingTimers);

      const result = await queue.acquire(2, async acquired => {
        expect(acquired).toEqual(jobs.slice(i * 2, i * 2 + 2));
        await delay(10);
        return acquired.map(() => ({
          success: true,
          payload: 'Success',
        }));
      });
      expect(queue.length).toBe(Math.max(0, 9 - i * 2 - 2));
      expect(result).toEqual(
        new Array(i === 4 ? 1 : 2).fill({
          success: true,
          payload: 'Success',
        })
      );

      switch (i) {
        case 4:
          expect(batch3Resolved).toBe(true);
          break;
        case 3:
        case 2:
          expect(batch3Resolved).toBe(false);
          expect(batch2Resolved).toBe(true);
          break;
        case 1:
          expect(batch2Resolved).toBe(false);
          expect(batch1Resolved).toBe(true);
          break;
        case 0:
          expect(batch1Resolved).toBe(false);
      }
    }

    expect(queue.length).toBe(0);
    await expect(Promise.all([batch1, batch2, batch3])).resolves.toEqual(
      new Array(3).fill({
        success: true,
        error: null,
        batchResult: new Array(3).fill({ success: true, payload: 'Success' }),
      })
    );
  });

  test('enqueueJobAndWait with less job acquire a time asynchronizedly', async () => {
    // The fake timers cause all acquirisitions finish at same tick
    // which would break the resolve order assertions
    jest.useRealTimers();
    /* eslint-disable no-return-assign, no-fallthrough, default-case */
    const jobs = new Array(9).fill(null).map((_, i) => ({ id: i }));
    const batch1 = queue.enqueueJobAndWait(...jobs.slice(0, 3));
    const batch2 = queue.enqueueJobAndWait(...jobs.slice(3, 6));
    const batch3 = queue.enqueueJobAndWait(...jobs.slice(6, 9));
    expect(queue.length).toBe(9);

    let batch1Resolved = false;
    let batch2Resolved = false;
    let batch3Resolved = false;
    batch1.then(() => (batch1Resolved = true));
    batch2.then(() => (batch2Resolved = true));
    batch3.then(() => (batch3Resolved = true));

    const promises = new Array(5).fill(null).map(async (_, i) =>
      queue.acquire(2, async acquired => {
        expect(acquired).toEqual(jobs.slice(i * 2, i * 2 + 2));
        expect(queue.length).toBe(Math.max(0, 9 - i * 2 - 2));

        await delay(i * 10);

        switch (i) {
          case 4:
          case 3:
            expect(batch3Resolved).toBe(false);
            expect(batch2Resolved).toBe(true);
            break;
          case 2:
            expect(batch2Resolved).toBe(false);
            expect(batch1Resolved).toBe(true);
            break;
          case 1:
          case 0:
            expect(batch1Resolved).toBe(false);
        }

        return acquired.map(() => ({ success: true, payload: 'Success' }));
      })
    );

    expect(queue.length).toBe(0);
    const result = await Promise.all(promises);

    expect(result).toEqual([
      new Array(2).fill({ success: true, payload: 'Success' }),
      new Array(2).fill({ success: true, payload: 'Success' }),
      new Array(2).fill({ success: true, payload: 'Success' }),
      new Array(2).fill({ success: true, payload: 'Success' }),
      [{ success: true, payload: 'Success' }],
    ]);
    await expect(Promise.all([batch1, batch2, batch3])).resolves.toEqual(
      new Array(3).fill({
        success: true,
        error: null,
        batchResult: new Array(3).fill({ success: true, payload: 'Success' }),
      })
    );
  });

  test('enqueueJobAndWait with more job acquire a time', async () => {
    /* eslint-disable no-return-assign, no-fallthrough, default-case */
    const jobs = new Array(9).fill(null).map((_, i) => ({ id: i }));
    const batch1 = queue.enqueueJobAndWait(...jobs.slice(0, 3));
    const batch2 = queue.enqueueJobAndWait(...jobs.slice(3, 6));
    const batch3 = queue.enqueueJobAndWait(...jobs.slice(6, 9));
    expect(queue.length).toBe(9);

    let batch1Resolved = false;
    let batch2Resolved = false;
    let batch3Resolved = false;
    batch1.then(() => (batch1Resolved = true));
    batch2.then(() => (batch2Resolved = true));
    batch3.then(() => (batch3Resolved = true));

    for (let i = 0; i < 2; i += 1) {
      setImmediate(jest.runOnlyPendingTimers);

      const result = await queue.acquire(5, async acquired => {
        expect(acquired).toEqual(jobs.slice(i * 5, i * 5 + 5));
        await delay(10);
        return acquired.map(() => ({ success: true, payload: 'Success' }));
      });

      if (i === 0) {
        expect(queue.length).toBe(4);
        expect(result).toEqual(
          new Array(5).fill({ success: true, payload: 'Success' })
        );
        expect(batch1Resolved).toBe(true);
        expect(batch2Resolved).toBe(false);
        expect(batch3Resolved).toBe(false);
      } else {
        expect(queue.length).toBe(0);
        expect(result).toEqual(
          new Array(4).fill({ success: true, payload: 'Success' })
        );
        expect(batch2Resolved).toBe(true);
        expect(batch3Resolved).toBe(true);
      }
    }

    expect(queue.length).toBe(0);
    await expect(Promise.all([batch1, batch2, batch3])).resolves.toEqual(
      new Array(3).fill({
        success: true,
        error: null,
        batchResult: new Array(3).fill({ success: true, payload: 'Success' }),
      })
    );
  });

  test('enqueueJobAndWait with acquire error', async () => {
    /* eslint-disable no-return-assign, no-fallthrough, default-case */
    const jobs = new Array(9).fill(null).map((_, i) => ({ id: i }));
    const batch1 = queue.enqueueJobAndWait(...jobs.slice(0, 3));
    const batch2 = queue.enqueueJobAndWait(...jobs.slice(3, 6));
    const batch3 = queue.enqueueJobAndWait(...jobs.slice(6, 9));
    expect(queue.length).toBe(9);

    for (let i = 0; i < 2; i += 1) {
      setImmediate(jest.runOnlyPendingTimers);

      try {
        await queue.acquire(5, async () => {
          throw new Error('somthing wrong');
        });
      } catch (e) {
        expect(e).toStrictEqual(new Error('somthing wrong'));
      }

      const failedResult = {
        success: false,
        error: new Error('somthing wrong'),
        batchResult: new Array(3),
      };
      if (i === 0) {
        expect(queue.length).toBe(3);
        expect(batch1).resolves.toStrictEqual(failedResult);
        expect(batch2).resolves.toStrictEqual(failedResult);
      } else {
        expect(queue.length).toBe(0);
        expect(batch3).resolves.toStrictEqual(failedResult);
      }
    }

    expect(queue.length).toBe(0);
  });

  test('enqueueJobAndWait with failed job returned by acquire', async () => {
    /* eslint-disable no-return-assign, no-fallthrough, default-case */
    const jobs = new Array(9).fill(null).map((_, i) => ({ id: i }));
    const batch1 = queue.enqueueJobAndWait(...jobs.slice(0, 3));
    const batch2 = queue.enqueueJobAndWait(...jobs.slice(3, 6));
    const batch3 = queue.enqueueJobAndWait(...jobs.slice(6, 9));
    expect(queue.length).toBe(9);

    for (let i = 0; i < 2; i += 1) {
      setImmediate(jest.runOnlyPendingTimers);

      await queue.acquire(5, async () => {
        const result = new Array(i ? 4 : 5).fill({
          success: true,
          payload: 'Success',
        });
        if (i === 0) result[3] = { success: false, payload: 'Fail' };
        return result;
      });

      if (i === 0) {
        expect(batch1).resolves.toStrictEqual({
          success: true,
          error: null,
          batchResult: new Array(3).fill({ success: true, payload: 'Success' }),
        });
        expect(batch2).resolves.toStrictEqual({
          success: false,
          error: 'Fail',
          batchResult: [
            { success: false, payload: 'Fail' },
            { success: true, payload: 'Success' },
            undefined,
          ],
        });
        expect(queue.length).toBe(3);
      } else {
        expect(queue.length).toBe(0);
        expect(batch3).resolves.toStrictEqual({
          success: true,
          error: null,
          batchResult: new Array(3).fill({ success: true, payload: 'Success' }),
        });
      }
    }

    expect(queue.length).toBe(0);
  });
});
