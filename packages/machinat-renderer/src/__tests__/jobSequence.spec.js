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

describe('#next() and #hasNext()', () => {
  it('pass batch of jobs by sequence order and ignore empty Immediate', () => {
    const renderedSequence = [
      [{ rendered: 0 }, { rendered: 1 }],
      [{ rendered: 2 }, { rendered: 3 }],
      <Machinat.Immediate />,
      [{ rendered: 4 }, { rendered: 5 }],
      <Machinat.Immediate />,
      <Machinat.Immediate />,
      [{ rendered: 6 }, { rendered: 7 }],
    ];
    const payload = {};
    const createJob = jest.fn(jobs => jobs.map(j => ({ id: j.rendered })));
    const jobSequence = new JobSequence(renderedSequence, payload, createJob);

    for (let t = 0; t < 5; t += 1) {
      if (t === 4) {
        expect(jobSequence.hasNext()).toBe(false);
        expect(jobSequence.next()).resolves.toBe(undefined);
      } else {
        expect(jobSequence.hasNext()).toBe(true);
        expect(jobSequence.next()).toEqual([{ id: t * 2 }, { id: t * 2 + 1 }]);
      }
    }

    expect(createJob.mock.calls).toEqual([
      [[{ rendered: 0 }, { rendered: 1 }], payload],
      [[{ rendered: 2 }, { rendered: 3 }], payload],
      [[{ rendered: 4 }, { rendered: 5 }], payload],
      [[{ rendered: 6 }, { rendered: 7 }], payload],
    ]);
  });

  it('pass promise to await if Immediate is not empty', async () => {
    jest.useFakeTimers();
    const myDelay = jest.fn(n => delay(n));

    const renderedSequence = [
      [{ rendered: 0 }, { rendered: 1 }],
      <Machinat.Immediate delay={100} />,
      [{ rendered: 2 }, { rendered: 3 }],
      <Machinat.Immediate after={() => myDelay(100)} />,
      [{ rendered: 4 }, { rendered: 5 }],
      <Machinat.Immediate delay={50} after={() => myDelay(50)} />,
      [{ rendered: 6 }, { rendered: 7 }],
    ];
    const payload = {};
    const createJob = jest.fn(jobs => jobs.map(j => ({ id: j.rendered })));
    const jobSequence = new JobSequence(renderedSequence, payload, createJob);

    for (let t = 0; t < 8; t += 1) {
      if (t === 7) {
        expect(jobSequence.hasNext()).toBe(false);
        expect(jobSequence.next()).resolves.toBe(undefined);
      } else {
        expect(jobSequence.hasNext()).toBe(true);

        if (t % 2 === 1) {
          const until = jobSequence.next();
          expect(until).toBeInstanceOf(Promise);

          const spy = jest.fn();
          until.then(spy);
          expect(spy).not.toHaveBeenCalled();

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
          expect(jobSequence.next()).toEqual([{ id: t }, { id: t + 1 }]);
        }
      }
    }

    expect(myDelay).toHaveBeenCalledTimes(2);

    expect(createJob.mock.calls).toEqual([
      [[{ rendered: 0 }, { rendered: 1 }], payload],
      [[{ rendered: 2 }, { rendered: 3 }], payload],
      [[{ rendered: 4 }, { rendered: 5 }], payload],
      [[{ rendered: 6 }, { rendered: 7 }], payload],
    ]);
  });
});
