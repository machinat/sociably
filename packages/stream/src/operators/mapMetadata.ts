import { MaybeContainer, ServiceContainer } from '@sociably/core/service';
import { OperatorFunction, StreamingFrame } from '../types';
import injectMaybe from '../injectMaybe';
import doAsyncByKey from './doAsyncByKey';

export type MapMetadataFn<T, R> = (
  frame: StreamingFrame<T>
) => Partial<StreamingFrame<R>> | Promise<Partial<StreamingFrame<R>>>;

/** @category Operator */
function mapMetadata<T, R>(
  mapper: ServiceContainer<MapMetadataFn<T, R>, unknown[]>
): OperatorFunction<T, R>;

function mapMetadata<T, R>(mapper: MapMetadataFn<T, R>): OperatorFunction<T, R>;

function mapMetadata<T, R>(
  mapper: MaybeContainer<MapMetadataFn<T, R>>
): OperatorFunction<T, R> {
  const injectMapper = injectMaybe(mapper);

  return doAsyncByKey(async (frame, observer) => {
    const updatingFrame = await injectMapper(frame)(frame);
    observer.next({ ...frame, ...updatingFrame } as StreamingFrame<R>);
  });
}

export default mapMetadata;
