import invariant from 'invariant';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import * as KEYWORDS from './keyword';
import type { MachinatScript, CallStatus, SerializedCallStatus } from './types';

type K = typeof KEYWORDS;
type KeywordsSymbol = K[keyof K];

const keyworsSymbols: unknown[] = Object.values(KEYWORDS);
export const isKeyword = (type: unknown): type is KeywordsSymbol =>
  keyworsSymbols.includes(type);

export const isScript = (
  type: any
): type is MachinatScript<any, any, any, any> =>
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

export const counter = (begin = 0): (() => number) => {
  let n = begin;
  return () => {
    n += 1;
    return n;
  };
};
