// @flow
import { MACHINAT_SCRIPT_TYPE } from './constant';
import * as KEYWORDS from './keyword';
import type { ScriptCallScope, ScriptExecuteState } from './types';

const keyworsSymbols = Object.values(KEYWORDS);
export const isKeyword = (type: any) => keyworsSymbols.includes(type);

export const isScript = (type: any): boolean %checks =>
  typeof type === 'object' && type.$$typeof === MACHINAT_SCRIPT_TYPE;

export const makeScriptState = (
  stack: ScriptCallScope[]
): ScriptExecuteState => ({
  version: 'V0',
  callStack: stack,
});

export const counter = (begin?: number = 0) => {
  let n = begin;
  return () => n++; // eslint-disable-line no-plusplus
};
