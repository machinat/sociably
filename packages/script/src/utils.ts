import invariant from 'invariant';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import type {
  AnyScriptLibrary,
  CallStatus,
  SerializedCallStatus,
  VarsOfScript,
} from './types';

export const isScript = (type: any): type is AnyScriptLibrary =>
  typeof type === 'object' &&
  type !== null &&
  type.$$typeof === MACHINAT_SCRIPT_TYPE;

export const serializeScriptStatus = <Script extends AnyScriptLibrary>({
  script,
  stopAt,
  vars,
}: CallStatus<Script>): SerializedCallStatus<VarsOfScript<Script>> => {
  invariant(
    stopAt,
    'call status is not stopped at any break point when serialize'
  );

  return {
    name: script.name,
    stopAt,
    vars: vars as VarsOfScript<Script>,
  };
};

export const createCounter = (begin = 0): (() => number) => {
  let n = begin;
  return () => {
    n += 1;
    return n;
  };
};
