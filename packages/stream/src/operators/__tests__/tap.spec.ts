import { moxy, Mock } from '@moxyjs/moxy';
import { serviceContainer, createEmptyScope } from '@sociably/core/service';
import Stream from '../../stream.js';
import { STREAMING_KEY_I } from '../../interface.js';
import tap from '../tap.js';

jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));
const nextTick = () => new Promise(process.nextTick);

const nextListener = moxy();
const nextContainer = moxy(
  serviceContainer({ deps: [STREAMING_KEY_I] })(() => nextListener)
);
const errorListener = moxy();
const errorContainer = moxy(
  serviceContainer({ deps: [STREAMING_KEY_I] })(() => errorListener)
);

beforeEach(() => {
  nextListener.mock.reset();
  nextContainer.mock.reset();
  errorListener.mock.reset();
  errorContainer.mock.reset();
});

test('execute each asyncronized side effect one by one', async () => {
  const tapper = moxy(() => delay(100));

  const stream = new Stream();
  stream.pipe(tap(tapper)).subscribe(nextContainer).catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 'A', key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 'B', key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 'C', key: 'foo' });

  expect(nextListener).not.toHaveBeenCalled();
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(3);
  expect(tapper).toHaveBeenCalledTimes(3);

  for (let i = 0; i < 3; i += 1) {
    expect(tapper).toHaveBeenNthCalledWith(i + 1, 'ABC'[i]);
    expect(nextListener).toHaveBeenNthCalledWith(i + 1, 'ABC'[i]);
  }

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(3);
  expect(nextContainer.$$factory).toHaveBeenCalledWith('foo');
  expect(errorListener).not.toHaveBeenCalled();
});

test('execute side effect with different keys parallelly', async () => {
  const stream = new Stream();
  stream
    .pipe(tap(() => delay(100)))
    .subscribe(nextContainer)
    .catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 'A', key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 'B', key: 'bar' });
  stream.next({ scope: createEmptyScope(), value: 'C', key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 'D', key: 'bar' });
  stream.next({ scope: createEmptyScope(), value: 'E', key: 'foo' });

  expect(nextListener).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(2);
  expect(nextContainer.$$factory).toHaveBeenNthCalledWith(1, 'foo');
  expect(nextContainer.$$factory).toHaveBeenNthCalledWith(2, 'bar');
  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenNthCalledWith(1, 'A');
  expect(nextListener).toHaveBeenNthCalledWith(2, 'B');

  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(4);
  expect(nextContainer.$$factory).toHaveBeenNthCalledWith(3, 'foo');
  expect(nextContainer.$$factory).toHaveBeenNthCalledWith(4, 'bar');
  expect(nextListener).toHaveBeenCalledTimes(4);
  expect(nextListener).toHaveBeenNthCalledWith(3, 'C');
  expect(nextListener).toHaveBeenNthCalledWith(4, 'D');

  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(5);
  expect(nextContainer.$$factory).toHaveBeenNthCalledWith(5, 'foo');
  expect(nextListener).toHaveBeenCalledTimes(5);
  expect(nextListener).toHaveBeenNthCalledWith(5, 'E');

  expect(errorListener).not.toHaveBeenCalled();
});

it('emit error if thrown in tap function', async () => {
  const stream = new Stream();
  stream
    .pipe(
      tap(async (value) => {
        await delay(100);
        if (value === 'B') {
          throw new Error('no');
        }
      })
    )
    .subscribe(nextContainer)
    .catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 'A', key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 'B', key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 'C', key: 'foo' });

  expect(nextListener).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith('A');

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(errorListener).toHaveBeenCalledWith(new Error('no'));

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenCalledWith('C');

  expect(errorListener).toHaveBeenCalledTimes(1);
  expect(errorContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(errorContainer.$$factory).toHaveBeenCalledWith('foo');
});

test('use service container side effect', async () => {
  const tapFnMock = new Mock();
  const tapper = moxy(
    serviceContainer({
      deps: [STREAMING_KEY_I],
    })(() => tapFnMock.proxify(async () => delay(100)))
  );

  const stream = new Stream();
  stream.pipe(tap(tapper)).subscribe(nextContainer).catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 'A', key: 'Foo' });
  stream.next({ scope: createEmptyScope(), value: 'B', key: 'Foo' });
  stream.next({ scope: createEmptyScope(), value: 'C', key: 'Foo' });

  expect(nextListener).not.toHaveBeenCalled();
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener).toHaveBeenCalledTimes(3);
  expect(tapper.$$factory).toHaveBeenCalledTimes(3);

  for (let i = 0; i < 3; i += 1) {
    expect(tapper.$$factory).toHaveBeenNthCalledWith(i + 1, 'Foo');
    expect(tapFnMock).toHaveBeenNthCalledWith(i + 1, 'ABC'[i]);
    expect(nextListener).toHaveBeenNthCalledWith(i + 1, 'ABC'[i]);
  }

  expect(nextContainer.$$factory).toHaveBeenCalledTimes(3);
  expect(nextContainer.$$factory).toHaveBeenCalledWith('Foo');
  expect(errorListener).not.toHaveBeenCalled();
});
