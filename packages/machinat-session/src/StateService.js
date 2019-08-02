// @flow
import Machinat from 'machinat';
import invariant from 'invariant';
import type { Session } from './types';

type StateServiceConsumed<T> = [T, ((T) => T) => void];

const provideStateService = (_session?: Session) => async (key, thunk) => {
  invariant(
    _session,
    'session in provided among the scope of <StateService.Consumer />'
  );

  const session = _session;
  const state = await session.get(key);

  const updateState = updater => {
    thunk(() => session.update(key, updater));
  };

  return [state, updateState];
};

const StateService = Machinat.createService<
  StateServiceConsumed<any>,
  Session,
  string
>(provideStateService);

export default StateService;
