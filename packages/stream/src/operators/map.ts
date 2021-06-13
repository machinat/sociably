import { MaybeContainer } from '@machinat/core/service';
import injectMaybe from '../injectMaybe';
import { OperatorFunction } from '../types';
import doAsyncByKey from './doAsyncByKey';

type MapFn<T, R> = (value: T) => R | Promise<R>;

function map<T, R>(mapper: MaybeContainer<MapFn<T, R>>): OperatorFunction<T, R>;

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
