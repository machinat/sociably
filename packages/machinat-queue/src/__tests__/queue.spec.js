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
  });

  test('enque one jobs and acquire it', async () => {
    const job = { id: 1 };
    queue.enqueue(job);
    expect(queue.length).toBe(1);

    let called = false;
    const result = await queue.acquire(1, jobs => {
      called = true;
      expect(jobs.length).toBe(1);
      expect(jobs[0]).toBe(job);
      return 'Success';
    });

    expect(queue.length).toBe(0);
    expect(called).toBe(true);
    expect(result).toBe('Success');
  });

  test('enque jobs and acquire  with failure', async () => {
    const jobs = [{ id: 1 }, { id: 2 }, { id: 3 }];
    queue.enqueue(...jobs);
    expect(queue.length).toBe(3);

    let called = false;
    await expect(
      queue.acquire(3, acquired => {
        called = true;
        expect(queue.length).toBe(0);
        expect(acquired.length).toBe(3);
        expect(acquired).toEqual(jobs);
        throw new Error('fail!');
      })
    ).rejects.toThrowError('fail!');

    expect(queue.length).toBe(3);
    expect(called).toBe(true);
  });

  test('enqueue many jobs and acquire synchronizedly', async () => {
    const jobs = new Array(11).fill(null).map((_, i) => ({ id: i }));
    queue.enqueue(...jobs);
    expect(queue.length).toBe(11);

    let count = 0;
    while (queue.length > 0) {
      const result = await queue.acquire(3, async acquired => {
        expect(acquired.length).toBe(11 - count < 3 ? 11 - count : 3);
        acquired.forEach(job => {
          expect(job).toEqual({ id: count });
          count += 1;
        });

        await delay(100);
        return 'Success';
      });

      expect(result).toBe('Success');
      expect(queue.length).toBe(11 - count);
    }

    expect(queue.length).toBe(0);
    expect(count).toBe(11);
  });

  test('enqueue many jobs and acquire asynchronizedly', async () => {
    const jobs = new Array(11).fill(null).map((_, i) => ({ id: i }));
    queue.enqueue(...jobs);
    expect(queue.length).toBe(11);

    let count = 0;
    const executions = [];
    while (queue.length > 0) {
      executions.push(
        queue.acquire(3, async acquired => {
          expect(acquired.length).toBe(11 - count < 3 ? 11 - count : 3);
          acquired.forEach(job => {
            expect(job).toEqual({ id: count });
            count += 1;
          });

          await delay(100);
          return 'Success';
        })
      );
      expect(queue.length).toBe(11 - count);
      await delay(20);
    }

    const result = await Promise.all(executions);

    expect(result).toEqual(['Success', 'Success', 'Success', 'Success']);
    expect(queue.length).toBe(0);
    expect(count).toBe(11);
  });

  test('acquire asynchronizedly with acquisitionLimit set', async () => {
    queue = new MachinatQueue({ acquisitionLimit: 2 });
    const jobs = new Array(11).fill(null).map((_, i) => ({ id: i }));
    queue.enqueue(...jobs);
    expect(queue.length).toBe(11);

    let count = 0;
    for (let t = 1; t <= 6; t += 1) {
      queue.acquire(
        2,
        (n => async acquired => {
          expect(queue.length).toBe(Math.max(11 - 2 * n, 0));
          acquired.forEach(job => {
            expect(job.id).toBeLessThan(11 - queue.length);
            count += 1;
          });

          await delay(100);
          return 'Success';
        })(t)
      );
    }
    expect(queue.length).toBe(11);
    await delay(10);
    expect(queue.length).toBe(7);
    await delay(100);
    expect(queue.length).toBe(3);
    await delay(100);
    expect(queue.length).toBe(0);

    expect(count).toBe(11);
  });
});
