import Subject from './subject';
import { StreamFrame } from './types';

const merge = <T>(sourceA: Subject<T>, sourceB: Subject<T>): Subject<T> => {
  const destination = new Subject<T>();

  const next = (frame: StreamFrame<T>) => destination.next(frame);
  const error = (frame: StreamFrame<Error>) => destination.error(frame);

  sourceA._subscribe(next, error);
  sourceB._subscribe(next, error);

  return destination;
};

export default merge;
