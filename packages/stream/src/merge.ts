import Stream from './stream';
import { StreamingFrame } from './types';

const merge = <T>(...sources: Stream<T>[]): Stream<T> => {
  const destination = new Stream<T>();

  const next = (frame: StreamingFrame<T>) => destination.next(frame);
  const error = (frame: StreamingFrame<Error>) => destination.error(frame);

  for (const source of sources) {
    source._subscribe(next, error);
  }

  return destination;
};

export default merge;
