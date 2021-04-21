import { MaybeContainer } from '@machinat/core/service';
import { OperatorFunction, StreamingFrame } from '../types';
import injectMaybe from '../injectMaybe';
import doAsyncByKey from './doAsyncByKey';

type MapMetadataFn<T, R> = (
  frame: StreamingFrame<T>
) => Partial<StreamingFrame<R>> | Promise<Partial<StreamingFrame<R>>>;

const mapMetadata = <T, R>(
  mapper: MaybeContainer<MapMetadataFn<T, R>>
): OperatorFunction<T, R> => {
  const injectMapper = injectMaybe(mapper);

  return doAsyncByKey(async (frame, observer) => {
    const updatingFrame = await injectMapper(frame)(frame);
    observer.next({ ...frame, ...updatingFrame } as StreamingFrame<R>);
  });
};

export default mapMetadata;
