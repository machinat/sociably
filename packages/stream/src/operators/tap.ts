import { MaybeContainer } from '@machinat/core/service/types';
import injectMaybe from '../injectMaybe';
import { OperatorFunction } from '../types';
import doAsyncByKey from './doAsyncByKey';

type EffectFn<T> = (val: T) => unknown | Promise<unknown>;

const tap = <T>(
  effecter: MaybeContainer<EffectFn<T>>
): OperatorFunction<T, T> => {
  const injectEffect = injectMaybe(effecter);

  return doAsyncByKey(async (frame, observer) => {
    try {
      await injectEffect(frame)(frame.value);
      observer.next(frame);
    } catch (err) {
      const { key, scope } = frame;
      observer.error({ value: err, key, scope });
    }
  });
};

export default tap;