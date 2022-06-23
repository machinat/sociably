import { MaybeContainer, ServiceContainer } from '@sociably/core/service';
import { OperatorFunction } from '../types';
import injectMaybe from '../injectMaybe';
import doAsyncByKey from './doAsyncByKey';

export type PredicateFn<T> = (value: T) => boolean | Promise<boolean>;

/** @category Operator */
function filter<
  T,
  Predicator extends ServiceContainer<PredicateFn<T>, unknown[]>
>(
  predicator: Predicator
): Predicator extends ServiceContainer<(v: any) => v is infer U, unknown[]>
  ? OperatorFunction<T, U>
  : OperatorFunction<T, T>;

function filter<T, Predicator extends PredicateFn<T>>(
  predicator: Predicator
): Predicator extends (v: any) => v is infer U
  ? OperatorFunction<T, U>
  : OperatorFunction<T, T>;

function filter<T, R = T>(
  predicator: MaybeContainer<PredicateFn<T>>
): OperatorFunction<T, R> {
  const injectPredicate = injectMaybe(predicator);

  return doAsyncByKey(async (frame, stream) => {
    const ok = await injectPredicate(frame)(frame.value);
    if (ok) {
      stream.next(frame as any);
    }
  });
}

export default filter;
