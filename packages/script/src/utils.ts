import invariant from 'invariant';
import { SOCIABLY_SCRIPT_TYPE } from './constant.js';
import type {
  AnyScriptLibrary,
  CallStatus,
  SerializedCallStatus,
} from './types.js';

export const isScript = (type: any): type is AnyScriptLibrary =>
  typeof type === 'object' &&
  type !== null &&
  type.$$typeof === SOCIABLY_SCRIPT_TYPE;

export const serializeScriptStatus = <Vars>({
  script,
  stopAt,
  vars,
}: CallStatus<Vars>): SerializedCallStatus<Vars> => {
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
