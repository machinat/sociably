import { ServiceScope } from '@sociably/core/service';
import Stream from '../stream.js';
import { OperatorFunction } from '../types.js';

type DebouncingCache<T> = {
  scope: ServiceScope;
  buffer: T[];
  timeoutId: NodeJS.Timeout;
};

/** @category Operator */
const debounce = <T>(t: number): OperatorFunction<T, T[]> => {
  const debouncingCaches = new Map<string, DebouncingCache<T>>();

  return (source: Stream<T>) => {
    const destination = new Stream<T[]>();

    const emitBufferedResult = (key) => {
      const cache = debouncingCaches.get(key);
      if (!cache) {
        return;
      }

      const { scope, buffer } = cache;
      destination.next({ key, value: buffer, scope });
      debouncingCaches.delete(key);
    };

    source._subscribe(
      ({ key, value, scope }) => {
        if (!key) {
          destination.next({ scope, key, value: [value] });
          return;
        }

        const cache = debouncingCaches.get(key);

        if (cache) {
          cache.scope = scope;
          cache.buffer.push(value);

          clearTimeout(cache.timeoutId);
          cache.timeoutId = setTimeout(emitBufferedResult, t, key);
        } else {
          debouncingCaches.set(key, {
            scope,
            buffer: [value],
            timeoutId: setTimeout(emitBufferedResult, t, key),
          });
        }
      },
      (frame) => destination.error(frame)
    );

    return destination;
  };
};

export default debounce;
