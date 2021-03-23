import { Subject as RxSubject } from 'rxjs';
import { MaybeContainer } from '@machinat/core/service/types';
import { StreamFrame, OperatorFunction } from './types';
import injectMaybe from './injectMaybe';
import pipe from './pipe';

export default class Subject<T> {
  _eventSubject: RxSubject<StreamFrame<T>>;
  _errorSubject: RxSubject<StreamFrame<Error>>;

  constructor() {
    this._eventSubject = new RxSubject();
    this._errorSubject = new RxSubject();
  }

  next(frame: StreamFrame<T>): void {
    this._eventSubject.next(frame);
  }

  error(frame: StreamFrame<Error>): void {
    if (this._errorSubject.observers.length === 0) {
      throw frame.value;
    }
    this._errorSubject.next(frame);
  }

  /* eslint-disable prettier/prettier */
  pipe<A,B>(fn1: OperatorFunction<A,B>): Subject<B>;
  pipe<A,B,C>(fn1: OperatorFunction<A,B>,fn2: OperatorFunction<B,C>): Subject<C>;
  pipe<A,B,C,D>(fn1: OperatorFunction<A,B>,fn2: OperatorFunction<B,C>,fn3: OperatorFunction<C,D>): Subject<D>;
  pipe<A,B,C,D,E>(fn1: OperatorFunction<A,B>,fn2: OperatorFunction<B,C>,fn3: OperatorFunction<C,D>,fn4: OperatorFunction<D,E>): Subject<E>;
  pipe<A,B,C,D,E,F>(fn1: OperatorFunction<A,B>,fn2: OperatorFunction<B,C>,fn3: OperatorFunction<C,D>,fn4: OperatorFunction<D,E>,fn5: OperatorFunction<E,F>): Subject<F>;
  pipe(...fns: OperatorFunction<unknown, unknown>[]): Subject<unknown>;
  /* eslint-enable prettier/prettier */
  pipe(...fns: OperatorFunction<unknown, unknown>[]): Subject<unknown> {
    return pipe(...fns)(this);
  }

  _subscribe(
    nextListener: (frame: StreamFrame<T>) => void,
    errorListener: (frame: StreamFrame<Error>) => void
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