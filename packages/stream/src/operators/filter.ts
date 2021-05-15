import { MaybeContainer } from '@machinat/core/service';
import { OperatorFunction } from '../types';
import injectMaybe from '../injectMaybe';
import doAsyncByKey from './doAsyncByKey';

type PredicateFn<T> = (value: T) => boolean | Promise<boolean>;

function filter<T, Predicator extends MaybeContainer<PredicateFn<T>>>(
  predicator: Predicator
): Predicator extends MaybeContainer<(v: any) => v is infer U>
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
