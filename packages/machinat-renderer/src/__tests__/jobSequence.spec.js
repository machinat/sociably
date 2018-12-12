import delay from 'delay';
import Machinat from '../../../machinat';
import JobSequence from '../jobSequence';

const nextTick = () => new Promise(setImmediate);

afterEach(() => {
  jest.useRealTimers();
});

it('is a constructor', () => {
  expect(() => new JobSequence()).not.toThrow();
});

it('is an iterator', () => {
  const jobSequence = new JobSequence([1, 2, 3], {}, x => x);

  expect(typeof jobSequence[Symbol.iterator]).toBe('function');

  const iterator = jobSequence[Symbol.iterator]();

  expect(typeof iterator.next).toBe('function');
  expect(iterator.next()).toEqual({ done: false, value: 1 });
  expect(iterator.next()).toEqual({ done: false, value: 2 });
  expect(iterator.next()).toEqual({ done: false, value: 3 });
  expect(iterator.next()).toEqual({ done: true });
});

it('pass batch of jobs by sequence order and ignore empty Immediate', () => {
  const renderedSequence = [
    [{ value: 0 }, { value: 1 }],
    [{ value: 2 }, { value: 3 }],
    <Machinat.Immediate />,
    [{ value: 4 }, { value: 5 }],
    <Machinat.Immediate />,
    <Machinat.Immediate />,
    [{ value: 6 }, { value: 7 }],
  ];

  const payload = {};
  const createJob = jest.fn(jobs => jobs.map(j => ({ id: j.value })));
  const jobSequence = new JobSequence(renderedSequence, payload, createJob);

  expect([...jobSequence]).toEqual([
    [{ id: 0 }, { id: 1 }],
    [{ id: 2 }, { id: 3 }],
    [{ id: 4 }, { id: 5 }],
    [{ id: 6 }, { id: 7 }],
  ]);

  expect(createJob.mock.calls).toEqual([
    [[{ value: 0 }, { value: 1 }], payload],
    [[{ value: 2 }, { value: 3 }], payload],
    [[{ value: 4 }, { value: 5 }], payload],
    [[{ value: 6 }, { value: 7 }], payload],
  ]);
});

it('pass promise to await if Immediate is not empty', async () => {
  jest.useFakeTimers();
  const myDelay = jest.fn(n => delay(n));

  const renderedSequence = [
    [{ value: 0 }, { value: 1 }],
    <Machinat.Immediate delay={100} />,
    [{ value: 2 }, { value: 3 }],
    <Machinat.Immediate after={() => myDelay(100)} />,
    [{ value: 4 }, { value: 5 }],
    <Machinat.Immediate delay={50} after={() => myDelay(50)} />,
    [{ value: 6 }, { value: 7 }],
  ];

  const payload = {};
  const createJob = jest.fn(jobs => jobs.map(j => ({ id: j.value })));
  const jobSequence = new JobSequence(renderedSequence, payload, createJob);
  const iterator = jobSequence[Symbol.iterator]();

  for (let t = 0; t < 8; t += 1) {
    if (t === 7) {
      expect(iterator.next()).toEqual({ done: true });
    } else {
      const next = iterator.next();
      expect(next.done).toBe(false);

      if (t % 2 === 1) {
        const until = next.value;
        expect(until).toBeInstanceOf(Promise);

        const spy = jest.fn();
        until.then(spy);

        // test the promise wait for delay then after in order
        if (t >= 3) {
          expect(myDelay).toHaveBeenCalledTimes(1);
          expect(myDelay).toHaveBeenCalledWith(100);
        }

        jest.advanceTimersByTime(50);
        await nextTick(); // eslint-disable-line no-await-in-loop
        if (t === 5) expect(myDelay).toHaveBeenCalledWith(50);

        jest.advanceTimersByTime(50);
        await nextTick(); // eslint-disable-line no-await-in-loop
        expect(spy).toHaveBeenCalledTimes(1);
      } else {
        expect(next.value).toEqual([{ id: t }, { id: t + 1 }]);
      }
    }
  }

  expect(myDelay).toHaveBeenCalledTimes(2);

  expect(createJob.mock.calls).toEqual([
    [[{ value: 0 }, { value: 1 }], payload],
    [[{ value: 2 }, { value: 3 }], payload],
    [[{ value: 4 }, { value: 5 }], payload],
    [[{ value: 6 }, { value: 7 }], payload],
  ]);
});
