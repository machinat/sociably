import moxy from '@moxyjs/moxy';
import { createEmptyScope } from '@machinat/core/service';
import Stream from '../../stream';
import bufferDebounceTime from '../bufferDebounceTime';

jest.useFakeTimers();

it('buffer frames by a debouncing time', () => {
  const source$ = new Stream();
  const buffered$ = source$.pipe(bufferDebounceTime(1500));

  const nextListener = moxy();
  const errorListener = moxy();

  buffered$.subscribe(nextListener, errorListener);

  source$.next({ scope: createEmptyScope(), value: 'A', key: 'foo' });
  source$.next({ scope: createEmptyScope(), value: 'B', key: 'foo' });

  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'C', key: 'foo' });

  jest.advanceTimersByTime(1000);
  expect(nextListener.mock).not.toHaveBeenCalled();

  jest.advanceTimersByTime(2000);
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith(['A', 'B', 'C']);

  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'D', key: 'foo' });

  expect(nextListener.mock).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(2000);

  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenCalledWith(['D']);

  expect(errorListener.mock).not.toHaveBeenCalled();
});

it('buffer frames with different keys separately', () => {
  const source$ = new Stream();
  const buffered$ = source$.pipe(bufferDebounceTime(2500));

  const nextListener = moxy();
  const errorListener = moxy();

  buffered$.subscribe(nextListener, errorListener);

  source$.next({ scope: createEmptyScope(), value: 'A', key: 'foo' });
  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'B', key: 'bar' });
  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'C', key: 'foo' });
  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'D', key: 'bar' });

  expect(nextListener.mock).not.toHaveBeenCalled();

  jest.advanceTimersByTime(2000);
  expect(nextListener.mock).toHaveBeenCalledTimes(1);
  expect(nextListener.mock).toHaveBeenCalledWith(['A', 'C']);

  source$.next({ scope: createEmptyScope(), value: 'E', key: 'foo' });

  jest.advanceTimersByTime(1000);
  expect(nextListener.mock).toHaveBeenCalledTimes(2);
  expect(nextListener.mock).toHaveBeenCalledWith(['B', 'D']);

  jest.advanceTimersByTime(2000);

  expect(nextListener.mock).toHaveBeenCalledTimes(3);
  expect(nextListener.mock).toHaveBeenCalledWith(['E']);
});

it('transmit error from source', () => {
  const source$ = new Stream();
  const buffered$ = source$.pipe(bufferDebounceTime(2500));

  const nextListener = moxy();
  const errorListener = moxy();

  buffered$.subscribe(nextListener, errorListener);

  source$.error({
    scope: createEmptyScope(),
    value: new Error('boo'),
    key: undefined,
  });

  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(new Error('boo'));
  expect(nextListener.mock).not.toHaveBeenCalled();
});
