import { MaybeContainer, ServiceContainer } from '@sociably/core/service';
import injectMaybe from '../injectMaybe';
import { OperatorFunction } from '../types';
import doAsyncByKey from './doAsyncByKey';

export type EffectFn<T> = (val: T) => unknown | Promise<unknown>;

/** @category Operator */
function tap<T>(
  effecter: ServiceContainer<EffectFn<T>, unknown[]>
): OperatorFunction<T, T>;

function tap<T>(effecter: EffectFn<T>): OperatorFunction<T, T>;

function tap<T>(effecter: MaybeContainer<EffectFn<T>>): OperatorFunction<T, T> {
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
}

export default tap;
