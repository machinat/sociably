import { MaybeContainer, ServiceContainer } from '@machinat/core/service';
import injectMaybe from '../injectMaybe';
import { OperatorFunction } from '../types';
import doAsyncByKey from './doAsyncByKey';

export type MapFn<T, R> = (value: T) => R | Promise<R>;

/** @category Operator */
function map<T, R>(
  mapper: ServiceContainer<MapFn<T, R>, unknown[]>
): OperatorFunction<T, R>;

function map<T, R>(mapper: MapFn<T, R>): OperatorFunction<T, R>;

function map<T, R>(
  mapper: MaybeContainer<MapFn<T, R>>
): OperatorFunction<T, R> {
  const injectMapper = injectMaybe(mapper);

  return doAsyncByKey(async (frame, observer) => {
    const { scope, key } = frame;

    const result = await injectMapper(frame)(frame.value);
    observer.next({ value: result, scope, key });
  });
}

export default map;
