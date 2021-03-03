import invariant from 'invariant';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import type {
  AnyScriptLibrary,
  CallStatus,
  SerializedCallStatus,
} from './types';

export const isScript = (type: any): type is AnyScriptLibrary =>
  typeof type === 'object' &&
  type !== null &&
  type.$$typeof === MACHINAT_SCRIPT_TYPE;

export const serializeScriptStatus = <Vars, Input, ReturnValue>({
  script,
  stopAt,
  vars,
}: CallStatus<Vars, Input, ReturnValue>): SerializedCallStatus<Vars> => {
  invariant(
    stopAt,
    'call status is not stopped at any break point when serialize'
  );

  return {
    name: script.name,
    stopAt,
    vars,
  };
};

export const createCounter = (begin = 0): (() => number) => {
  let n = begin;
  return () => {
    n += 1;
    return n;
  };
};
