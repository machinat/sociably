import { MaybeContainer } from '@machinat/core/service/types';
import { OperatorFunction } from '../types';
import injectMaybe from '../injectMaybe';
import doAsyncByKey from './doAsyncByKey';

type PredicateFn<T> = (value: T) => boolean | Promise<boolean>;

const filterAsync = <T, R = T>(
  predicator: MaybeContainer<PredicateFn<T>>
): OperatorFunction<T, R> => {
  const injectPredicate = injectMaybe(predicator);

  return doAsyncByKey(async (frame, observer) => {
    const ok = await injectPredicate(frame)(frame.value);
    if (ok) {
      observer.next(frame as any);
    }
  });
};

export default filterAsync;
