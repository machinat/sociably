/* eslint-disable no-await-in-loop, no-loop-func, no-return-assign, no-fallthrough, default-case */
import moxy from '@moxyjs/moxy';
import MachinatQueue from '../queue';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));
const makeJobs = (n) => new Array(n).fill(0).map((_, i) => ({ id: i }));

const successJobResponses = (ids) =>
  ids.map((id) => ({
    success: true,
    result: `Success${id}`,
    error: undefined,
    job: { id },
  }));

const failedJobResponses = (ids) =>
  ids.map((id) => ({
    success: false,
    result: `Fail${id}`,
    error: new Error(`Fail${id}`),
    job: { id },
  }));

let queue;
const consume = jest.fn();

const jobs = makeJobs(9);
const batch1Resolved = jest.fn();
const batch2Resolved = jest.fn();
const batch3Resolved = jest.fn();

beforeEach(() => {
  jest.useFakeTimers('modern');
  queue = new MachinatQueue();

  consume.mockImplementation(async (acquired) => {
    await delay(10);
    return successJobResponses(acquired.map((job) => job.id));
  });

  batch1Resolved.mockClear();
  batch2Resolved.mockClear();
  batch3Resolved.mockClear();
});

afterEach(() => {
  consume.mockClear();
});

it('is a constructor', () => {
  expect(() => new MachinatQueue()).not.toThrow();
});

describe('#onJob(cb)', () => {
  it('calls cb when jobs enqueued', () => {
    const cb1 = moxy();
    const cb2 = moxy();

    queue.onJob(cb1);
    queue.onJob(cb2);

    queue.executeJobs(jobs);
    queue.executeJobs(jobs);

    expect(cb1.mock).toHaveBeenCalledTimes(2);
    expect(cb2.mock).toHaveBeenCalledTimes(2);

    expect(cb1.mock.calls[0].args[0]).toBe(queue);
    expect(cb1.mock.calls[1].args[0]).toBe(queue);
    expect(cb2.mock.calls[0].args[0]).toBe(queue);
    expect(cb2.mock.calls[1].args[0]).toBe(queue);
  });
});

describe('#offJob(cb)', () => {
  it('remove job listener cb', () => {
    const cb1 = moxy();
    const cb2 = moxy();

    queue.onJob(cb1);
    queue.onJob(cb2);
    queue.executeJobs(jobs);

    expect(cb1.mock).toHaveBeenCalledTimes(1);
    expect(cb2.mock).toHaveBeenCalledTimes(1);

    queue.offJob(cb1);
    queue.executeJobs(jobs);

    expect(cb1.mock).toHaveBeenCalledTimes(1);
    expect(cb2.mock).toHaveBeenCalledTimes(2);

    queue.offJob(cb2);
    queue.executeJobs(jobs);

    expect(cb1.mock).toHaveBeenCalledTimes(1);
    expect(cb2.mock).toHaveBeenCalledTimes(2);
  });
});

describe('#peekAt(idx)', () => {
  it('returns job at idx', () => {
    queue.executeJobs(jobs).then(batch1Resolved);
    expect(queue.length).toBe(9);

    for (let i = 0; i < 9; i += 1) {
      expect(queue.peekAt(i)).toBe(jobs[i]);
    }

    expect(queue.peekAt(9)).toBe(undefined);
    expect(queue.peekAt(10)).toBe(undefined);
    expect(queue.peekAt(11)).toBe(undefined);
  });

  it('returns job at negative idx', () => {
    queue.executeJobs(jobs).then(batch1Resolved);
    expect(queue.length).toBe(9);

    for (let i = -1; i > -10; i -= 1) {
      expect(queue.peekAt(i)).toBe(jobs[9 + i]);
    }

    expect(queue.peekAt(-10)).toBe(undefined);
    expect(queue.peekAt(-11)).toBe(undefined);
    expect(queue.peekAt(-12)).toBe(undefined);
  });
});

describe('#executeJobs(jobs)', () => {
  it('enqueue jobs', () => {
    queue.executeJobs(jobs.slice(0, 3));
    queue.executeJobs(jobs.slice(3, 6));
    queue.executeJobs(jobs.slice(6, 9));

    expect(queue.length).toBe(9);
  });

  it('resolve a empty success response if empty jobs passed', () =>
    expect(queue.executeJobs([])).resolves.toEqual({
      success: true,
      errors: null,
      batch: [],
    }));
});

describe('as a FIFO queue', () => {
  test('with less job acquire() a time', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    for (let i = 0; i < 5; i += 1) {
      const promise = queue.acquire(2, consume);
      jest.runOnlyPendingTimers();

      await expect(promise).resolves.toEqual(
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
    [batch1Resolved, batch2Resolved, batch3Resolved].forEach((resolved, i) => {
      const s = i * 3;
      expect(resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batch: successJobResponses([s, s + 1, s + 2]),
      });
    });
  });

  test('with more job acquire() a time', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    for (let i = 0; i < 2; i += 1) {
      const promise = queue.acquire(5, consume);
      jest.runOnlyPendingTimers();

      await expect(promise).resolves.toEqual(
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
    [batch1Resolved, batch2Resolved, batch3Resolved].forEach((resolved, i) => {
      expect(resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batch: successJobResponses([i * 3, i * 3 + 1, i * 3 + 2]),
      });
    });
  });

  test('with acquire() consumption error', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    consume.mockImplementation(async (acquired) => {
      await delay(10);
      if (acquired[0].id === 2 || acquired[0].id === 4) {
        throw new Error('somthing wrong');
      }
      return successJobResponses(acquired.map((j) => j.id));
    });

    for (let i = 0; i < 5; i += 1) {
      const promise = queue.acquire(2, consume);
      jest.runOnlyPendingTimers();

      if (i === 1) {
        await expect(promise).rejects.toThrow('somthing wrong');
      } else if (i === 4) {
        await expect(promise).resolves.toBe(undefined);
      } else {
        await expect(promise).resolves.toEqual(
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
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    consume.mockImplementation(async (acquired) => {
      await delay(10);
      return acquired.map((job) => {
        const success = ![3, 6, 8].includes(job.id);

        const [response] = success
          ? successJobResponses([job.id])
          : failedJobResponses([job.id]);
        return response;
      });
    });

    let promise = queue.acquire(5, consume);
    jest.runOnlyPendingTimers();

    await expect(promise).resolves.toEqual([
      ...successJobResponses([0, 1, 2]),
      ...failedJobResponses([3]),
      ...successJobResponses([4]),
    ]);

    expect(queue.length).toBe(3);
    expect(consume).toHaveBeenCalledTimes(1);
    expect(batch1Resolved).toHaveBeenCalled();
    expect(batch2Resolved).toHaveBeenCalled();
    expect(batch3Resolved).not.toHaveBeenCalled();

    promise = queue.acquire(5, consume);
    jest.runOnlyPendingTimers();

    await expect(promise).resolves.toEqual([
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

    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    const promises = new Array(5).fill(0).map(async (_, i) =>
      queue.acquire(2, async (acquired) => {
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

        return successJobResponses(acquired.map((job) => job.id));
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
    [batch1Resolved, batch2Resolved, batch3Resolved].forEach((resolved, i) => {
      const b = i * 3;
      expect(resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batch: successJobResponses([b, b + 1, b + 2]),
      });
    });
  });

  test('with more job acquire() asynchronizedly a time', async () => {
    jest.useRealTimers();

    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    const promises = new Array(2).fill(0).map(async (_, i) =>
      queue.acquire(5, async (acquired) => {
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

        return successJobResponses(acquired.map((job) => job.id));
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
    [batch1Resolved, batch2Resolved, batch3Resolved].forEach((resolved, i) => {
      const b = i * 3;
      expect(resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batch: successJobResponses([b, b + 1, b + 2]),
      });
    });
  });

  test('with acquire() consumption error asynchronizedly', async () => {
    jest.useRealTimers();

    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    const promises = new Array(5).fill(0).map(async (_, i) =>
      queue.acquire(2, async (acquired) => {
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

        return successJobResponses(acquired.map((job) => job.id));
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

    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    const promises = new Array(5).fill(0).map(async (_, i) =>
      queue.acquire(2, async (acquired) => {
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

        return acquired.map((job) => {
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

describe('as a FILO queue', () => {
  test('with less job acquire() a time', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    for (let i = 0; i < 5; i += 1) {
      const promise = queue.acquireAt(Math.max(9 - i * 2 - 2, 0), 2, consume);
      jest.runOnlyPendingTimers();

      await expect(promise).resolves.toEqual(
        successJobResponses(i !== 4 ? [9 - i * 2 - 2, 9 - i * 2 - 1] : [0])
      );

      expect(queue.length).toBe(Math.max(0, 9 - i * 2 - 2));

      expect(consume).toHaveBeenCalledTimes(i + 1);
      expect(consume).toHaveBeenNthCalledWith(
        i + 1,
        jobs.slice(-i * 2 - 2, 9 - i * 2)
      );

      switch (i) {
        case 0:
          expect(batch3Resolved).not.toHaveBeenCalled();
          break;
        case 1:
          expect(batch2Resolved).not.toHaveBeenCalled();
          expect(batch3Resolved).toHaveBeenCalled();
          break;
        case 2:
        case 3:
          expect(batch1Resolved).not.toHaveBeenCalled();
          expect(batch2Resolved).toHaveBeenCalled();
          break;
        case 4:
          expect(batch1Resolved).toHaveBeenCalled();
          break;
      }
    }

    expect(queue.length).toBe(0);
    [batch1Resolved, batch2Resolved, batch3Resolved].forEach((resolved, i) => {
      const s = i * 3;
      queue.acquireAt(Math.max(9 - i * 2 - 2, 0), 2, consume);
      expect(resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batch: successJobResponses([s, s + 1, s + 2]),
      });
    });
  });

  test('with more job acquire() a time', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    for (let i = 0; i < 2; i += 1) {
      const promise = queue.acquireAt(i === 0 ? 4 : 0, 5, consume);
      jest.runOnlyPendingTimers();

      await expect(promise).resolves.toEqual(
        successJobResponses(!i ? [4, 5, 6, 7, 8] : [0, 1, 2, 3])
      );

      expect(consume).toHaveBeenCalledTimes(i + 1);
      expect(consume).toHaveBeenNthCalledWith(
        i + 1,
        i === 0 ? jobs.slice(4, 9) : jobs.slice(0, 4)
      );

      expect(queue.length).toBe(i === 0 ? 4 : 0);
      if (i === 0) {
        expect(batch3Resolved).toHaveBeenCalled();
        expect(batch2Resolved).not.toHaveBeenCalled();
        expect(batch1Resolved).not.toHaveBeenCalled();
      } else {
        expect(batch2Resolved).toHaveBeenCalled();
        expect(batch1Resolved).toHaveBeenCalled();
      }
    }

    expect(queue.length).toBe(0);
    [batch1Resolved, batch2Resolved, batch3Resolved].forEach((resolved, i) => {
      expect(resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batch: successJobResponses([i * 3, i * 3 + 1, i * 3 + 2]),
      });
    });
  });

  test('with acquire() consumption error', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    consume.mockImplementation(async (acquired) => {
      await delay(10);
      if (acquired[0].id === 5 || acquired[0].id === 3) {
        throw new Error('somthing wrong');
      }
      return successJobResponses(acquired.map((j) => j.id));
    });

    for (let i = 0; i < 5; i += 1) {
      const begin = Math.max(queue.length - 2, 0);
      const promise = queue.acquireAt(begin, 2, consume);
      jest.runOnlyPendingTimers();

      if (i === 1) {
        await expect(promise).rejects.toThrow('somthing wrong');
      } else if (i === 4) {
        await expect(promise).resolves.toBe(undefined);
      } else {
        await expect(promise).resolves.toEqual(
          successJobResponses(i === 3 ? [0] : i === 2 ? [1, 2] : [7, 8])
        );
      }

      expect(queue.length).toBe(Math.max(0, 9 - (i + (i === 0 ? 1 : 2)) * 2));

      expect(consume).toHaveBeenCalledTimes(i === 4 ? 4 : i + 1);
      if (i < 4)
        expect(consume).toHaveBeenNthCalledWith(
          i + 1,
          i < 2
            ? jobs.slice(9 - i * 2 - 2, 9 - i * 2)
            : i === 2
            ? jobs.slice(1, 3)
            : jobs.slice(0, 1)
        );

      switch (i) {
        case 0:
          expect(batch3Resolved).not.toHaveBeenCalled();
          break;
        case 1:
          expect(batch3Resolved).toHaveBeenCalled();
          expect(batch2Resolved).toHaveBeenCalled();
        case 2:
          expect(batch1Resolved).not.toHaveBeenCalled();
          break;
        case 3:
          expect(batch1Resolved).toHaveBeenCalled();
          break;
      }
    }

    expect(queue.length).toBe(0);

    expect(batch1Resolved).toHaveBeenCalledWith({
      success: true,
      errors: null,
      batch: successJobResponses([0, 1, 2]),
    });
    expect(batch2Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('somthing wrong')],
      batch: null,
    });
    expect(batch3Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('somthing wrong')],
      batch: [undefined, ...successJobResponses([7, 8])],
    });
  });

  test('with failed job returned by acquire()', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    consume.mockImplementation(async (acquired) => {
      await delay(10);
      return acquired.map((job) => {
        const success = ![0, 2, 5].includes(job.id);

        const [response] = success
          ? successJobResponses([job.id])
          : failedJobResponses([job.id]);
        return response;
      });
    });

    let promise = queue.acquireAt(4, 5, consume);
    jest.runOnlyPendingTimers();

    await expect(promise).resolves.toEqual([
      ...successJobResponses([4]),
      ...failedJobResponses([5]),
      ...successJobResponses([6, 7, 8]),
    ]);

    expect(queue.length).toBe(3);
    expect(consume).toHaveBeenCalledTimes(1);
    expect(batch3Resolved).toHaveBeenCalled();
    expect(batch2Resolved).toHaveBeenCalled();
    expect(batch1Resolved).not.toHaveBeenCalled();

    promise = queue.acquireAt(0, 5, consume);
    jest.runOnlyPendingTimers();
    await expect(promise).resolves.toEqual([
      ...failedJobResponses([0]),
      ...successJobResponses([1]),
      ...failedJobResponses([2]),
    ]);

    expect(queue.length).toBe(0);
    expect(consume).toHaveBeenCalledTimes(2);
    expect(batch1Resolved).toHaveBeenCalled();

    expect(consume.mock.calls).toEqual([
      [[{ id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }]],
      [[{ id: 0 }, { id: 1 }, { id: 2 }]],
    ]);

    expect(batch3Resolved).toHaveBeenCalledWith({
      success: true,
      errors: null,
      batch: successJobResponses([6, 7, 8]),
    });
    expect(batch2Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('Fail5')],
      batch: [
        undefined,
        ...successJobResponses([4]),
        ...failedJobResponses([5]),
      ],
    });
    expect(batch1Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('Fail0'), new Error('Fail2')],
      batch: [
        ...failedJobResponses([0]),
        ...successJobResponses([1]),
        ...failedJobResponses([2]),
      ],
    });
  });
});

describe('acquire disorderly', () => {
  test('when all succeed', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    for (let i = 0; i < 5; i += 1) {
      let promise;

      switch (i) {
        case 0:
          promise = queue.acquireAt(5, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual(successJobResponses([5, 6]));
          expect(consume).toHaveBeenNthCalledWith(i + 1, jobs.slice(5, 7));
          break;

        case 1:
          promise = queue.acquireAt(2, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual(successJobResponses([2, 3]));
          expect(consume).toHaveBeenNthCalledWith(i + 1, jobs.slice(2, 4));
          expect(batch2Resolved).not.toHaveBeenCalled();
          break;
        case 2:
          promise = queue.acquireAt(2, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual(successJobResponses([4, 7]));
          expect(consume).toHaveBeenNthCalledWith(i + 1, [jobs[4], jobs[7]]);

          expect(batch2Resolved).toHaveBeenCalled();
          expect(batch3Resolved).not.toHaveBeenCalled();
          break;
        case 3:
          promise = queue.acquireAt(1, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual(successJobResponses([1, 8]));
          expect(consume).toHaveBeenNthCalledWith(i + 1, [jobs[1], jobs[8]]);

          expect(batch3Resolved).toHaveBeenCalled();
          expect(batch1Resolved).not.toHaveBeenCalled();
          break;
        case 4:
          promise = queue.acquireAt(0, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual(successJobResponses([0]));
          expect(consume).toHaveBeenNthCalledWith(i + 1, [jobs[0]]);
          expect(batch1Resolved).toHaveBeenCalled();
          break;
      }

      expect(consume).toHaveBeenCalledTimes(i + 1);
      expect(queue.length).toBe(Math.max(0, 9 - i * 2 - 2));
    }

    expect(queue.length).toBe(0);
    [batch1Resolved, batch2Resolved, batch3Resolved].forEach((resolved, i) => {
      const s = i * 3;
      expect(resolved).toHaveBeenCalledWith({
        success: true,
        errors: null,
        batch: successJobResponses([s, s + 1, s + 2]),
      });
    });
  });

  test('when consumption error happen', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    consume.mockImplementation(async (acquired) => {
      await delay(10);
      if (acquired[0].id === 2 || acquired[0].id === 7) {
        throw new Error('somthing wrong');
      }
      return successJobResponses(acquired.map((j) => j.id));
    });

    for (let i = 0; i < 3; i += 1) {
      let promise;

      switch (i) {
        case 0:
          promise = queue.acquireAt(5, 2, consume);
          jest.runOnlyPendingTimers();
          await expect(promise).resolves.toEqual(successJobResponses([5, 6]));

          expect(consume).toHaveBeenNthCalledWith(i + 1, jobs.slice(5, 7));
          expect(queue.length).toBe(7);

          expect(batch1Resolved).not.toHaveBeenCalled();
          expect(batch2Resolved).not.toHaveBeenCalled();
          break;

        case 1:
          promise = queue.acquireAt(2, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).rejects.toThrow('somthing wrong');
          expect(consume).toHaveBeenNthCalledWith(i + 1, jobs.slice(2, 4));
          expect(queue.length).toBe(2);

          expect(batch1Resolved).toHaveBeenCalled();
          expect(batch2Resolved).toHaveBeenCalled();
          expect(batch3Resolved).not.toHaveBeenCalled();
          break;

        case 2:
          promise = queue.acquireAt(0, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).rejects.toThrow('somthing wrong');
          expect(consume).toHaveBeenNthCalledWith(i + 1, [jobs[7], jobs[8]]);
          expect(queue.length).toBe(0);
          expect(batch3Resolved).toHaveBeenCalled();
          break;
      }

      expect(consume).toHaveBeenCalledTimes(i + 1);
    }

    expect(batch1Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('somthing wrong')],
      batch: null,
    });
    expect(batch2Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('somthing wrong')],
      batch: [undefined, undefined, ...successJobResponses([5])],
    });
    expect(batch3Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('somthing wrong')],
      batch: [...successJobResponses([6]), undefined, undefined],
    });
  });

  test('with failed job returned by acquire()', async () => {
    queue.executeJobs(jobs.slice(0, 3)).then(batch1Resolved);
    queue.executeJobs(jobs.slice(3, 6)).then(batch2Resolved);
    queue.executeJobs(jobs.slice(6, 9)).then(batch3Resolved);

    consume.mockImplementation(async (acquired) => {
      await delay(10);
      return acquired.map((job) => {
        const success = ![1, 3, 8].includes(job.id);

        const [response] = success
          ? successJobResponses([job.id])
          : failedJobResponses([job.id]);
        return response;
      });
    });

    for (let i = 0; i < 4; i += 1) {
      let promise;

      switch (i) {
        case 0:
          promise = queue.acquireAt(5, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual(successJobResponses([5, 6]));
          expect(consume).toHaveBeenNthCalledWith(i + 1, jobs.slice(5, 7));
          expect(queue.length).toBe(7);
          expect(batch2Resolved).not.toHaveBeenCalled();
          break;
        case 1:
          promise = queue.acquireAt(2, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual([
            ...successJobResponses([2]),
            ...failedJobResponses([3]),
          ]);

          expect(consume).toHaveBeenNthCalledWith(i + 1, jobs.slice(2, 4));
          expect(queue.length).toBe(4);

          expect(batch2Resolved).toHaveBeenCalled();
          expect(batch1Resolved).not.toHaveBeenCalled();
          break;

        case 2:
          promise = queue.acquireAt(1, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual([
            ...failedJobResponses([1]),
            ...successJobResponses([7]),
          ]);

          expect(consume).toHaveBeenNthCalledWith(i + 1, [jobs[1], jobs[7]]);
          expect(queue.length).toBe(1);

          expect(batch1Resolved).toHaveBeenCalled();
          expect(batch3Resolved).not.toHaveBeenCalled();
          break;

        case 3:
          promise = queue.acquireAt(0, 2, consume);
          jest.runOnlyPendingTimers();

          await expect(promise).resolves.toEqual(failedJobResponses([8]));
          expect(consume).toHaveBeenNthCalledWith(i + 1, [jobs[8]]);
          expect(queue.length).toBe(0);
          expect(batch3Resolved).toHaveBeenCalled();
          break;
      }

      expect(consume).toHaveBeenCalledTimes(i + 1);
    }

    expect(batch1Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('Fail1')],
      batch: [
        undefined,
        ...failedJobResponses([1]),
        ...successJobResponses([2]),
      ],
    });
    expect(batch2Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('Fail3')],
      batch: [
        ...failedJobResponses([3]),
        undefined,
        ...successJobResponses([5]),
      ],
    });
    expect(batch3Resolved).toHaveBeenCalledWith({
      success: false,
      errors: [new Error('Fail8')],
      batch: [...successJobResponses([6, 7]), ...failedJobResponses([8])],
    });
  });
});
