import Subject from '../subject';
import { StreamFrame, OperatorFunction } from '../types';

const doAsyncByKey = <T, R>(
  effect: (frame: StreamFrame<T>, observer: Subject<R>) => Promise<void>
): OperatorFunction<T, R> => {
  return (input: Subject<T>) => {
    const buffersByChannel = new Map<string, StreamFrame<T>[]>();
    const destination = new Subject<R>();

    const execute = async (frame: StreamFrame<T>) => {
      const { scope, key } = frame;

      try {
        await effect(frame, destination);
      } catch (err) {
        destination.error({ key, scope, value: err });
      } finally {
        let queued;
        if (key && (queued = buffersByChannel.get(key))) {
          if (queued.length > 0) {
            const nextFrame = queued.shift();
            execute(nextFrame);
          } else {
            buffersByChannel.delete(key);
          }
        }
      }
    };

    input._subscribe(
      (frame: StreamFrame<T>) => {
        const { key } = frame;
        if (!key) {
          execute(frame);
          return;
        }

        const buffer = buffersByChannel.get(key);
        if (buffer) {
          buffer.push(frame);
        } else {
          buffersByChannel.set(key, []);
          execute(frame);
        }
      },

      (errFrame: StreamFrame<Error>) => {
        destination.error(errFrame);
      }
    );

    return destination;
  };
};

export default doAsyncByKey;
