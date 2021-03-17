import moxy from '@moxyjs/moxy';
import { makeContainer, createEmptyScope } from '@machinat/core/service';
import { STREAMING_KEY_I } from '../../interface';
import Subject from '../../subject';
import filter from '../filter';

jest.useFakeTimers();

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));
const nextTick = () => new Promise(process.nextTick);

const nextListener = moxy();
const nextContainer = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => nextListener)
);
const errorListener = moxy();
const errorContainer = moxy(
  makeContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
);

beforeEach(() => {
  nextListener.mock.reset();
  nextContainer.mock.reset();
  errorListener.mock.reset();
  errorContainer.mock.reset();
});

test('execute each asyncronized filterFn one by one', async () => {
  const filterFn = moxy(async (value) => {
    await delay(100);
    return value % 2 === 1;
  });

  const subject = new Subject();
  subject.pipe(filter(filterFn)).subscribe(nextContainer, errorContainer);

  subject.next({ scope: createEmptyScope(), value: 1, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 2, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 3, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 4, key: 'foo' });

  expect(nextListener.mock).not.toHaveBeenCalled();
  expect(filterFn.mock).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(filterFn.mock).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(filterFn.mock).toHaveBeenCalledTimes(3);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(filterFn.mock).toHaveBeenCalledTimes(4);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(2);

  for (let i = 1; i <= 4; i += 1) {
    expect(filterFn.mock).toHaveBeenNthCalledWith(i, i);
  }
  expect(nextListener.mock).toHaveBeenNthCalledWith(1, 1);
  expect(nextListener.mock).toHaveBeenNthCalledWith(2, 3);

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('foo');
  expect(errorListener.mock).not.toHaveBeenCalled();
});

test('filter frames with different keys parallelly', async () => {
  const filterFn = moxy(async (value) => {
    await delay(100);
    return value % 2 === 1;
  });

  const subject = new Subject();
  subject.pipe(filter(filterFn)).subscribe(nextContainer, errorContainer);

  subject.next({ scope: createEmptyScope(), value: 1, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 2, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 3, key: 'bar' });
  subject.next({ scope: createEmptyScope(), value: 4, key: 'bar' });
  subject.next({ scope: createEmptyScope(), value: 5, key: 'foo' });

  expect(nextListener.mock).not.toHaveBeenCalled();

  expect(filterFn.mock).toHaveBeenCalledTimes(2);
  expect(filterFn.mock).toHaveBeenNthCalledWith(1, 1);
  expect(filterFn.mock).toHaveBeenNthCalledWith(2, 3);

  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(nextContainer.$$factory.mock).toHaveBeenNthCalledWith(1, 'foo');
  expect(nextContainer.$$factory.mock).toHaveBeenNthCalledWith(2, 'bar');
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenNthCalledWith(1, 1);
  expect(nextListener.mock).toHaveBeenNthCalledWith(2, 3);

  expect(filterFn.mock).toHaveBeenCalledTimes(4);
  expect(filterFn.mock).toHaveBeenNthCalledWith(3, 2);
  expect(filterFn.mock).toHaveBeenNthCalledWith(4, 4);
  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextListener.mock).toHaveBeenCalledTimes(2);

  expect(filterFn.mock).toHaveBeenCalledTimes(5);
  jest.advanceTimersByTime(100);
  await nextTick();

  expect(filterFn.mock).toHaveBeenCalledWith(5);

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(3);
  expect(nextContainer.$$factory.mock).toHaveBeenNthCalledWith(3, 'foo');
  expect(nextListener.mock).toHaveBeenCalledTimes(3);
  expect(nextListener.mock).toHaveBeenNthCalledWith(3, 5);

  expect(errorListener.mock).not.toHaveBeenCalled();
});

it('emit error if thrown in filterFn', async () => {
  const filterFn = moxy(async (value) => {
    await delay(100);
    if (value === 2) {
      throw new Error('no');
    }
    return value % 2 === 1;
  });

  const subject = new Subject();
  subject.pipe(filter(filterFn)).subscribe(nextContainer, errorContainer);

  subject.next({ scope: createEmptyScope(), value: 1, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 2, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 3, key: 'foo' });

  expect(nextListener.mock).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith(1);
  expect(errorListener.mock).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(new Error('no'));

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenCalledWith(3);

  expect(filterFn.mock).toHaveBeenCalledTimes(3);
  expect(errorContainer.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(errorContainer.$$factory.mock).toHaveBeenCalledWith('foo');
  expect(errorListener.mock).toHaveBeenCalledTimes(1);
});

test('use service container as filterer', async () => {
  const filterFn = moxy(async (value) => {
    await delay(100);
    return value % 2 === 1;
  });
  const filterContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => filterFn)
  );

  const subject = new Subject();
  subject
    .pipe(filter(filterContainer))
    .subscribe(nextContainer, errorContainer);

  subject.next({ scope: createEmptyScope(), value: 1, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 2, key: 'foo' });
  subject.next({ scope: createEmptyScope(), value: 3, key: 'foo' });

  expect(nextListener.mock).not.toHaveBeenCalled();
  expect(filterFn.mock).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(filterFn.mock).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith(1);
  expect(filterFn.mock).toHaveBeenCalledTimes(3);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('foo');
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenCalledWith(3);

  expect(filterContainer.$$factory.mock).toHaveBeenCalledTimes(3);
  expect(filterContainer.$$factory.mock).toHaveBeenCalledWith('foo');

  expect(filterFn.mock).toHaveBeenNthCalledWith(1, 1);
  expect(filterFn.mock).toHaveBeenNthCalledWith(2, 2);
  expect(filterFn.mock).toHaveBeenNthCalledWith(3, 3);

  expect(errorListener.mock).not.toHaveBeenCalled();
});
