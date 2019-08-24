// @flow
import { MACHINAT_SCRIPT_TYPE } from './constant';
import * as KEYWORDS from './keyword';
import type {
  CallingStatus,
  CallingStatusArchive,
  ScriptProcessingState,
} from './types';

const keyworsSymbols = Object.values(KEYWORDS);
export const isKeyword = (type: any) => keyworsSymbols.includes(type);

export const isScript = (type: any): boolean %checks =>
  typeof type === 'object' && type.$$typeof === MACHINAT_SCRIPT_TYPE;

const archiveStatus = ({
  script,
  vars,
  at,
}: CallingStatus): CallingStatusArchive => ({
  name: script.name,
  stoppedAt: at,
  vars,
});

export const archiveScriptState = (
  stack: CallingStatus[]
): ScriptProcessingState => ({
  version: 'V0',
  callStack: stack.map(archiveStatus),
});

export const counter = (begin?: number = 0) => {
  let n = begin;
  return () => n++; // eslint-disable-line no-plusplus
};
