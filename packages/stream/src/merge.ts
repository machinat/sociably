import Stream from './stream.js';
import { StreamingFrame } from './types.js';

/* eslint-disable */
function merge<A,B>(a:Stream<A>,b:Stream<B>):Stream<A|B>
function merge<A,B,C>(a:Stream<A>,b:Stream<B>,c:Stream<C>):Stream<A|B|C>
function merge<A,B,C,D>(a:Stream<A>,b:Stream<B>,c:Stream<C>,d:Stream<D>):Stream<A|B|C|D>
function merge<A,B,C,D,E>(a:Stream<A>,b:Stream<B>,c:Stream<C>,d:Stream<D>,e:Stream<E>):Stream<A|B|C|D|E>
function merge<A,B,C,D,E,F>(a:Stream<A>,b:Stream<B>,c:Stream<C>,d:Stream<D>,e:Stream<E>,f:Stream<F>):Stream<A|B|C|D|E|F>
function merge<A,B,C,D,E,F,G>(a:Stream<A>,b:Stream<B>,c:Stream<C>,d:Stream<D>,e:Stream<E>,f:Stream<F>,g:Stream<G>):Stream<A|B|C|D|E|F|G>
function merge<A,B,C,D,E,F,G,H>(a:Stream<A>,b:Stream<B>,c:Stream<C>,d:Stream<D>,e:Stream<E>,f:Stream<F>,g:Stream<G>,h:Stream<H>):Stream<A|B|C|D|E|F|G|H>
function merge<A,B,C,D,E,F,G,H,I>(a:Stream<A>,b:Stream<B>,c:Stream<C>,d:Stream<D>,e:Stream<E>,f:Stream<F>,g:Stream<G>,h:Stream<H>,i:Stream<I>):Stream<A|B|C|D|E|F|G|H|I>
/* eslint-enable */
function merge<T>(...sources: Stream<T>[]): Stream<T> {
  const destination = new Stream<T>();

  const next = (frame: StreamingFrame<T>) => destination.next(frame);
  const error = (frame: StreamingFrame<Error>) => destination.error(frame);

  for (const source of sources) {
    source._subscribe(next, error);
  }

  return destination;
}

export default merge;
