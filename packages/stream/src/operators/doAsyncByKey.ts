import Stream from '../stream';
import { StreamingFrame, OperatorFunction } from '../types';

const doAsyncByKey = <T, R>(
  effect: (frame: StreamingFrame<T>, observer: Stream<R>) => Promise<void>
): OperatorFunction<T, R> => {
  return (input: Stream<T>) => {
    const buffersByChannel = new Map<string, StreamingFrame<T>[]>();
    const destination = new Stream<R>();

    const execute = async (frame: StreamingFrame<T>) => {
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
      (frame: StreamingFrame<T>) => {
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

      (errFrame: StreamingFrame<Error>) => {
        destination.error(errFrame);
      }
    );

    return destination;
  };
};

export default doAsyncByKey;
