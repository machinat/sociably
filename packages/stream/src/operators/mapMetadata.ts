import { MaybeContainer } from '@machinat/core/service/types';
import { OperatorFunction, StreamFrame } from '../types';
import injectMaybe from '../injectMaybe';
import doAsyncByKey from './doAsyncByKey';

type MapMetadataFn<T, R> = (
  frame: StreamFrame<T>
) => Partial<StreamFrame<R>> | Promise<Partial<StreamFrame<R>>>;

const mapMetadata = <T, R>(
  mapper: MaybeContainer<MapMetadataFn<T, R>>
): OperatorFunction<T, R> => {
  const injectMapper = injectMaybe(mapper);

  return doAsyncByKey(async (frame, observer) => {
    const updatingFrame = await injectMapper(frame)(frame);
    observer.next({ ...frame, ...updatingFrame } as StreamFrame<R>);
  });
};

export default mapMetadata;
