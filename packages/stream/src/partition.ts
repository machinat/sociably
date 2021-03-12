import { MaybeContainer } from '@machinat/core/service/types';
import injectMaybe from './injectMaybe';
import Subject from './subject';

type RredicateFn<T> = (value: T) => boolean | Promise<boolean>;

const partition = <T>(
  source: Subject<T>,
  predicator: MaybeContainer<RredicateFn<T>>
) => {
  const trueDestination = new Subject<T>();
  const falseDestination = new Subject<T>();

  const injectPredicate = injectMaybe(predicator);

  source._subscribe(
    async (frame) => {
      try {
        const ok = await injectPredicate(frame)(frame.value);

        if (ok) {
          trueDestination.next(frame);
        } else {
          falseDestination.next(frame);
        }
      } catch (err) {
        const { scope, key } = frame;
        const errorFrame = { scope, key, value: err };

        trueDestination.error(errorFrame);
        falseDestination.error(errorFrame);
      }
    },

    (frame) => {
      trueDestination.error(frame);
      falseDestination.error(frame);
    }
  );

  return [trueDestination, falseDestination];
};

export default partition;
