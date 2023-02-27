import moxy from '@moxyjs/moxy';
import { makeContainer, createEmptyScope } from '@sociably/core/service';
import { STREAMING_KEY_I } from '../../interface';
import Stream from '../../stream';
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

  const stream = new Stream();
  stream.pipe(filter(filterFn)).subscribe(nextContainer).catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 1, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 2, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 3, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 4, key: 'foo' });

  expect(nextListener).not.toHaveBeenCalled();
  expect(filterFn).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(filterFn).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(filterFn).toHaveBeenCalledTimes(3);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(filterFn).toHaveBeenCalledTimes(4);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(2);

  for (let i = 1; i <= 4; i += 1) {
    expect(filterFn).toHaveBeenNthCalledWith(i, i);
  }
  expect(nextListener).toHaveBeenNthCalledWith(1, 1);
  expect(nextListener).toHaveBeenNthCalledWith(2, 3);

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(2);
  expect(nextContainer.$$factory).toHaveBeenCalledWith('foo');
  expect(errorListener).not.toHaveBeenCalled();
});

test('filter frames with different keys parallelly', async () => {
  const filterFn = moxy(async (value) => {
    await delay(100);
    return value % 2 === 1;
  });

  const stream = new Stream();
  stream.pipe(filter(filterFn)).subscribe(nextContainer).catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 1, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 2, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 3, key: 'bar' });
  stream.next({ scope: createEmptyScope(), value: 4, key: 'bar' });
  stream.next({ scope: createEmptyScope(), value: 5, key: 'foo' });

  expect(nextListener).not.toHaveBeenCalled();

  expect(filterFn).toHaveBeenCalledTimes(2);
  expect(filterFn).toHaveBeenNthCalledWith(1, 1);
  expect(filterFn).toHaveBeenNthCalledWith(2, 3);

  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(2);
  expect(nextContainer.$$factory).toHaveBeenNthCalledWith(1, 'foo');
  expect(nextContainer.$$factory).toHaveBeenNthCalledWith(2, 'bar');
  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenNthCalledWith(1, 1);
  expect(nextListener).toHaveBeenNthCalledWith(2, 3);

  expect(filterFn).toHaveBeenCalledTimes(4);
  expect(filterFn).toHaveBeenNthCalledWith(3, 2);
  expect(filterFn).toHaveBeenNthCalledWith(4, 4);
  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextListener).toHaveBeenCalledTimes(2);

  expect(filterFn).toHaveBeenCalledTimes(5);
  jest.advanceTimersByTime(100);
  await nextTick();

  expect(filterFn).toHaveBeenCalledWith(5);

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(3);
  expect(nextContainer.$$factory).toHaveBeenNthCalledWith(3, 'foo');
  expect(nextListener).toHaveBeenCalledTimes(3);
  expect(nextListener).toHaveBeenNthCalledWith(3, 5);

  expect(errorListener).not.toHaveBeenCalled();
});

it('emit error if thrown in filterFn', async () => {
  const filterFn = moxy(async (value) => {
    await delay(100);
    if (value === 2) {
      throw new Error('no');
    }
    return value % 2 === 1;
  });

  const stream = new Stream();
  stream.pipe(filter(filterFn)).subscribe(nextContainer).catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 1, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 2, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 3, key: 'foo' });

  expect(nextListener).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith(1);
  expect(errorListener).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(errorListener).toHaveBeenCalledWith(new Error('no'));

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenCalledWith(3);

  expect(filterFn).toHaveBeenCalledTimes(3);
  expect(errorContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(errorContainer.$$factory).toHaveBeenCalledWith('foo');
  expect(errorListener).toHaveBeenCalledTimes(1);
});

test('use service container as filterer', async () => {
  const filterFn = moxy(async (value) => {
    await delay(100);
    return value % 2 === 1;
  });
  const filterContainer = moxy(
    makeContainer({ deps: [STREAMING_KEY_I] })(() => filterFn)
  );

  const stream = new Stream();
  stream
    .pipe(filter(filterContainer))
    .subscribe(nextContainer)
    .catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 1, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 2, key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 3, key: 'foo' });

  expect(nextListener).not.toHaveBeenCalled();
  expect(filterFn).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(filterFn).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith(1);
  expect(filterFn).toHaveBeenCalledTimes(3);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextContainer.$$factory).toHaveBeenCalledTimes(2);
  expect(nextContainer.$$factory).toHaveBeenCalledWith('foo');
  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenCalledWith(3);

  expect(filterContainer.$$factory).toHaveBeenCalledTimes(3);
  expect(filterContainer.$$factory).toHaveBeenCalledWith('foo');

  expect(filterFn).toHaveBeenNthCalledWith(1, 1);
  expect(filterFn).toHaveBeenNthCalledWith(2, 2);
  expect(filterFn).toHaveBeenNthCalledWith(3, 3);

  expect(errorListener).not.toHaveBeenCalled();
});
