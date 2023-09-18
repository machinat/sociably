import moxy from '@moxyjs/moxy';
import { createEmptyScope } from '@sociably/core/service';
import Stream from '../../stream.js';
import debounce from '../debounce.js';

jest.useFakeTimers();

it('buffer frames by a debouncing time', () => {
  const source$ = new Stream();
  const buffered$ = source$.pipe(debounce(1500));

  const nextListener = moxy();
  const errorListener = moxy();

  buffered$.subscribe(nextListener).catch(errorListener);

  source$.next({ scope: createEmptyScope(), value: 'A', key: 'foo' });
  source$.next({ scope: createEmptyScope(), value: 'B', key: 'foo' });

  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'C', key: 'foo' });

  jest.advanceTimersByTime(1000);
  expect(nextListener).not.toHaveBeenCalled();

  jest.advanceTimersByTime(2000);
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith(['A', 'B', 'C']);

  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'D', key: 'foo' });

  expect(nextListener).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(2000);

  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenCalledWith(['D']);

  expect(errorListener).not.toHaveBeenCalled();
});

it('buffer frames with different keys separately', () => {
  const source$ = new Stream();
  const buffered$ = source$.pipe(debounce(2500));

  const nextListener = moxy();
  const errorListener = moxy();

  buffered$.subscribe(nextListener).catch(errorListener);

  source$.next({ scope: createEmptyScope(), value: 'A', key: 'foo' });
  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'B', key: 'bar' });
  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'C', key: 'foo' });
  jest.advanceTimersByTime(1000);
  source$.next({ scope: createEmptyScope(), value: 'D', key: 'bar' });

  expect(nextListener).not.toHaveBeenCalled();

  jest.advanceTimersByTime(2000);
  expect(nextListener).toHaveBeenCalledTimes(1);
  expect(nextListener).toHaveBeenCalledWith(['A', 'C']);

  source$.next({ scope: createEmptyScope(), value: 'E', key: 'foo' });

  jest.advanceTimersByTime(1000);
  expect(nextListener).toHaveBeenCalledTimes(2);
  expect(nextListener).toHaveBeenCalledWith(['B', 'D']);

  jest.advanceTimersByTime(2000);

  expect(nextListener).toHaveBeenCalledTimes(3);
  expect(nextListener).toHaveBeenCalledWith(['E']);
});

it('transmit error from source', () => {
  const source$ = new Stream();
  const buffered$ = source$.pipe(debounce(2500));

  const nextListener = moxy();
  const errorListener = moxy();

  buffered$.subscribe(nextListener).catch(errorListener);

  source$.error({
    scope: createEmptyScope(),
    value: new Error('boo'),
    key: undefined,
  });

  expect(errorListener).toHaveBeenCalledTimes(1);
  expect(errorListener).toHaveBeenCalledWith(new Error('boo'));
  expect(nextListener).not.toHaveBeenCalled();
});
