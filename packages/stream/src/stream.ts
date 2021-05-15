import { Subject as RxSubject } from 'rxjs';
import { MaybeContainer } from '@machinat/core/service';
import { StreamingFrame, OperatorFunction } from './types';
import injectMaybe from './injectMaybe';
import pipe from './pipe';

export default class Stream<T> {
  _eventSubject: RxSubject<StreamingFrame<T>>;
  _errorSubject: RxSubject<StreamingFrame<Error>>;

  constructor() {
    this._eventSubject = new RxSubject();
    this._errorSubject = new RxSubject();
  }

  next(frame: StreamingFrame<T>): void {
    this._eventSubject.next(frame);
  }

  error(frame: StreamingFrame<Error>): void {
    if (this._errorSubject.observers.length === 0) {
      throw frame.value;
    }
    this._errorSubject.next(frame);
  }

  /* eslint-disable prettier/prettier */
  pipe<A>(fn1: OperatorFunction<T, A>): Stream<A>;
  pipe<A,B>(fn1: OperatorFunction<T,A>, fn2: OperatorFunction<A,B>): Stream<B>;
  pipe<A,B,C>(fn1: OperatorFunction<T,A>,fn2: OperatorFunction<A,B>,fn3: OperatorFunction<B,C>): Stream<C>;
  pipe<A,B,C,D>(fn1: OperatorFunction<T,A>,fn2: OperatorFunction<A,B>,fn3: OperatorFunction<B,C>,fn4: OperatorFunction<C,D>): Stream<D>;
  pipe<A,B,C,D,E>(fn1: OperatorFunction<T,A>,fn2: OperatorFunction<A,B>,fn3: OperatorFunction<B,C>,fn4: OperatorFunction<C,D>,fn5: OperatorFunction<D,E>): Stream<E>;
  pipe<A,B,C,D,E,F>(fn1: OperatorFunction<T,A>,fn2: OperatorFunction<A,B>,fn3: OperatorFunction<B,C>,fn4: OperatorFunction<C,D>,fn5: OperatorFunction<D,E>,fn6: OperatorFunction<E,F>): Stream<F>;
  pipe(...fns: OperatorFunction<unknown, unknown>[]): Stream<unknown>;
  /* eslint-enable prettier/prettier */
  pipe(...fns: OperatorFunction<any, unknown>[]): Stream<unknown> {
    return pipe(...fns)(this);
  }

  _subscribe(
    nextListener: (frame: StreamingFrame<T>) => void,
    errorListener: (frame: StreamingFrame<Error>) => void
  ): void {
    if (nextListener) {
      this._eventSubject.subscribe(nextListener);
    }

    if (errorListener) {
      this._errorSubject.subscribe(errorListener);
    }
  }

  subscribe(
    nextListener: MaybeContainer<(value: T) => void>,
    errorListener?: MaybeContainer<(err: Error) => void>
  ): void {
    const injectNextListener = injectMaybe(nextListener);

    this._eventSubject.subscribe((frame) =>
      injectNextListener(frame)(frame.value)
    );

    if (errorListener) {
      this.catch(errorListener);
    }
  }

  catch(errorListener: MaybeContainer<(err: Error) => void>): void {
    const injectErrorListener = injectMaybe(errorListener);

    this._errorSubject.subscribe((frame) =>
      injectErrorListener(frame)(frame.value)
    );
  }
}
