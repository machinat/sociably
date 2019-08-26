// @flow
import Machinat from 'machinat';
import invariant from 'invariant';
import type { Session } from './types';

type StateServiceConsumed<T> = [T, ((T) => T) => void];
type StateServiceProviderProps = {| session: Session |};
type StateServiceConsumerProps = {| key: string |};

const provideStateService = ({ session }: StateServiceProviderProps = {}) => {
  const fetchingCache = new Map();

  return async ({ key }: StateServiceConsumerProps, thunk) => {
    invariant(
      session,
      'session in provided among the scope of <StateService.Consumer />'
    );

    let promise = fetchingCache.get(key);
    if (promise === undefined) {
      promise = session.get(key);
      fetchingCache.set(key, promise);
    }

    const state = await promise;

    const setState = updater => {
      thunk(() =>
        typeof updater === 'function'
          ? session.update(key, updater)
          : session.set(key, updater)
      );
    };

    return [state, setState];
  };
};

const StateService = Machinat.createService<
  StateServiceConsumed<any>,
  StateServiceProviderProps,
  StateServiceConsumerProps
>(provideStateService);

export default StateService;
