// @flow
import Machinat from 'machinat';
import invariant from 'invariant';
import type { Session } from './types';

type StateServiceConsumed<T> = [T, ((T) => T) => void];
type StateServiceProviderProps = {| session: Session |};
type StateServiceConsumerProps = {| key: string |};

const provideStateService = ({
  session,
}: StateServiceProviderProps = {}) => async (
  { key }: StateServiceConsumerProps,
  thunk
) => {
  invariant(
    session,
    'session in provided among the scope of <StateService.Consumer />'
  );

  const state = await session.get(key);

  const updateState = updater => {
    thunk(() => session.update(key, updater));
  };

  return [state, updateState];
};

const StateService = Machinat.createService<
  StateServiceConsumed<any>,
  StateServiceProviderProps,
  StateServiceConsumerProps
>(provideStateService);

export default StateService;
