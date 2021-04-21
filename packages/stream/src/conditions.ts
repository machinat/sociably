import { MaybeContainer } from '@machinat/core/service';
import injectMaybe from './injectMaybe';
import Stream from './stream';

type PredicateFn<T> = (value: T) => boolean | Promise<boolean>;

const conditions = <T>(
  source: Stream<T>,
  predicators: MaybeContainer<PredicateFn<T>>[]
): Stream<T>[] => {
  const destinations = predicators.map(() => new Stream<T>());

  const injectablePredicators = predicators.map((predicateFnOrContainer) =>
    injectMaybe(predicateFnOrContainer)
  );

  source._subscribe(
    async (frame) => {
      for (let i = 0; i < destinations.length; i += 1) {
        const injectPredicate = injectablePredicators[i];

        try {
          const ok = await injectPredicate(frame)(frame.value); // eslint-disable-line no-await-in-loop

          if (ok) {
            destinations[i].next(frame);
            return;
          }
        } catch (err) {
          const { scope, key } = frame;
          destinations[i].error({ scope, key, value: err });
        }
      }
    },

    (frame) => {
      for (const destination of destinations) {
        destination.error(frame);
      }
    }
  );

  return destinations;
};

export default conditions;
