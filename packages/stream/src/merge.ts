import Stream from './stream';
import { StreamingFrame } from './types';

const merge = <T>(sourceA: Stream<T>, sourceB: Stream<T>): Stream<T> => {
  const destination = new Stream<T>();

  const next = (frame: StreamingFrame<T>) => destination.next(frame);
  const error = (frame: StreamingFrame<Error>) => destination.error(frame);

  sourceA._subscribe(next, error);
  sourceB._subscribe(next, error);

  return destination;
};

export default merge;
