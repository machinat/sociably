import moxy, { Mock } from '@moxyjs/moxy';
import { makeContainer, createEmptyScope } from '@sociably/core/service';
import Stream from '../../stream';
import { STREAMING_KEY_I } from '../../interface';
import tap from '../tap';

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

test('execute each asyncronized side effect one by one', async () => {
  const tapper = moxy(() => delay(100));

  const stream = new Stream();
  stream.pipe(tap(tapper)).subscribe(nextContainer).catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 'A', key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 'B', key: 'foo' });
  stream.next({ scope: createEmptyScope(), value: 'C', key: 'foo' });

  expect(nextListener.mock).not.toHaveBeenCalled();
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(3);
  expect(tapper.mock).toHaveBeenCalledTimes(3);

  for (let i = 0; i < 3; i += 1) {
    expect(tapper.mock).toHaveBeenNthCalledWith(i + 1, 'ABC'[i]);
    expect(nextListener.mock).toHaveBeenNthCalledWith(i + 1, 'ABC'[i]);
  }

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(3);
  expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('foo');
  expect(errorListener.mock).not.toHaveBeenCalled();
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

  expect(nextListener.mock).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(nextContainer.$$factory.mock).toHaveBeenNthCalledWith(1, 'foo');
  expect(nextContainer.$$factory.mock).toHaveBeenNthCalledWith(2, 'bar');
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenNthCalledWith(1, 'A');
  expect(nextListener.mock).toHaveBeenNthCalledWith(2, 'B');

  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(4);
  expect(nextContainer.$$factory.mock).toHaveBeenNthCalledWith(3, 'foo');
  expect(nextContainer.$$factory.mock).toHaveBeenNthCalledWith(4, 'bar');
  expect(nextListener.mock).toHaveBeenCalledTimes(4);
  expect(nextListener.mock).toHaveBeenNthCalledWith(3, 'C');
  expect(nextListener.mock).toHaveBeenNthCalledWith(4, 'D');

  jest.advanceTimersByTime(100);
  await nextTick();

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(5);
  expect(nextContainer.$$factory.mock).toHaveBeenNthCalledWith(5, 'foo');
  expect(nextListener.mock).toHaveBeenCalledTimes(5);
  expect(nextListener.mock).toHaveBeenNthCalledWith(5, 'E');

  expect(errorListener.mock).not.toHaveBeenCalled();
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

  expect(nextListener.mock).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith('A');

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(new Error('no'));

  jest.advanceTimersByTime(100);
  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenCalledWith('C');

  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorContainer.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(errorContainer.$$factory.mock).toHaveBeenCalledWith('foo');
});

test('use service container side effect', async () => {
  const tapFnMock = new Mock();
  const tapper = moxy(
    makeContainer({
      deps: [STREAMING_KEY_I],
    })(() => tapFnMock.proxify(async () => delay(100)))
  );

  const stream = new Stream();
  stream.pipe(tap(tapper)).subscribe(nextContainer).catch(errorContainer);

  stream.next({ scope: createEmptyScope(), value: 'A', key: 'Foo' });
  stream.next({ scope: createEmptyScope(), value: 'B', key: 'Foo' });
  stream.next({ scope: createEmptyScope(), value: 'C', key: 'Foo' });

  expect(nextListener.mock).not.toHaveBeenCalled();
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(100);

  await nextTick();
  expect(nextListener.mock).toHaveBeenCalledTimes(3);
  expect(tapper.$$factory.mock).toHaveBeenCalledTimes(3);

  for (let i = 0; i < 3; i += 1) {
    expect(tapper.$$factory.mock).toHaveBeenNthCalledWith(i + 1, 'Foo');
    expect(tapFnMock).toHaveBeenNthCalledWith(i + 1, 'ABC'[i]);
    expect(nextListener.mock).toHaveBeenNthCalledWith(i + 1, 'ABC'[i]);
  }

  expect(nextContainer.$$factory.mock).toHaveBeenCalledTimes(3);
  expect(nextContainer.$$factory.mock).toHaveBeenCalledWith('Foo');
  expect(errorListener.mock).not.toHaveBeenCalled();
});
