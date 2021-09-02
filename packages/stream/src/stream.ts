import { Subject as RxSubject } from 'rxjs';
import { MaybeContainer } from '@machinat/core/service';
import { StreamingFrame, OperatorFunction } from './types';
import injectMaybe from './injectMaybe';
import pipe from './pipe';

export default class Stream<T> {
  private _eventSubject: RxSubject<StreamingFrame<T>>;
  private _errorSubject: RxSubject<StreamingFrame<Error>>;
  private _errorListeners: ((
    frame: StreamingFrame<Error>
  ) => (err: Error) => unknown | Promise<unknown>)[];

  constructor() {
    this._eventSubject = new RxSubject();
    this._errorSubject = new RxSubject();

    this._errorListeners = [];
  }

  next(frame: StreamingFrame<T>): void {
    this._eventSubject.next(frame);
  }

  error(frame: StreamingFrame<Error>): void {
    if (!this._catchError(frame)) {
      if (this._errorSubject.observers.length > 0) {
        this._errorSubject.next(frame);
      } else {
        throw frame.value;
      }
    }
  }

  /**
   * pipe through a series of operators and return the piped stream.
   */
  pipe<A>(fn1: OperatorFunction<T, A>): Stream<A>;
  pipe<A, B>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>
  ): Stream<B>;

  pipe<A, B, C>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>
  ): Stream<C>;

  pipe<A, B, C, D>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>
  ): Stream<D>;

  pipe<A, B, C, D, E>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>
  ): Stream<E>;

  pipe<A, B, C, D, E, F>(
    fn1: OperatorFunction<T, A>,
    fn2: OperatorFunction<A, B>,
    fn3: OperatorFunction<B, C>,
    fn4: OperatorFunction<C, D>,
    fn5: OperatorFunction<D, E>,
    fn6: OperatorFunction<E, F>
  ): Stream<F>;

  pipe(...fns: OperatorFunction<unknown, unknown>[]): Stream<unknown>;

  pipe(...fns: OperatorFunction<any, unknown>[]): Stream<unknown> {
    return pipe(...fns)(this);
  }

  /**
   * This is an interal API used by operators.
   */
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

  /**
   * Subscribe to all events flow to the stream. This doesn't stop the events
   * from going down to the piped streams.
   *
   * If an error is thrown in the event subscriber, it's handled by the
   * following order:
   *   1. Be catched the errorCatcher parameter if given.
   *   2. Be catched by error listeners registered by `catch` method
   *   3. Throw immediately.
   */
  subscribe(
    subscriber: MaybeContainer<(value: T) => unknown | Promise<unknown>>,
    errorCatcher?: MaybeContainer<(err: Error) => unknown | Promise<unknown>>
  ): Stream<T> {
    const emitEvent = injectMaybe(subscriber);
    const catchError = errorCatcher ? injectMaybe(errorCatcher) : null;

    this._eventSubject.subscribe(async (frame) => {
      try {
        await emitEvent(frame)(frame.value);
      } catch (err) {
        if (catchError) {
          catchError(frame)(err);
        } else {
          const { scope, key } = frame;
          if (!this._catchError({ scope, key, value: err })) {
            throw err;
          }
        }
      }
    });

    return this;
  }

  /**
   * Catch unstream errors and event subscriber errors. Upstream errors are
   * handled by the folowing order:
   *   1. Be catched by error listeners registered by this method
   *   2. Go down to piped streams.
   *   3. If no piped stream, throw immediately.
   */
  catch(
    errorListener: MaybeContainer<(err: Error) => unknown | Promise<unknown>>
  ): Stream<T> {
    this._errorListeners.push(injectMaybe(errorListener));
    return this;
  }

  private _catchError(frame: StreamingFrame<Error>): boolean {
    if (this._errorListeners.length === 0) {
      return false;
    }

    for (const errListener of this._errorListeners) {
      errListener(frame)(frame.value);
    }

    return true;
  }
}
