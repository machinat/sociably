import { isServiceContainer, MaybeContainer } from '@sociably/core/service';
import { StreamingFrame } from './types.js';
import { STREAMING_KEY_I } from './interface.js';

type Fn<Args extends unknown[], Result> = (...args: Args) => Result;

const injectMaybe = <Args extends unknown[], Result>(
  fnOrContainer: MaybeContainer<Fn<Args, Result>>,
): ((frame: StreamingFrame<unknown>) => (...args: Args) => Result) => {
  if (!isServiceContainer(fnOrContainer)) {
    return () => fnOrContainer;
  }

  return (frame: StreamingFrame<unknown>) =>
    (...args: Args): Result => {
      const { key, scope } = frame;
      const provisions = new Map([[STREAMING_KEY_I, key]]);

      return scope.injectContainer(fnOrContainer, provisions)(...args);
    };
};

export default injectMaybe;
