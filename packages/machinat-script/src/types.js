// @flow
/* eslint-disable no-use-before-define */
import type { MachinatNode, MachinatComponentType } from 'machinat/types';
import typeof { MACHINAT_SCRIPT_TYPE } from './constant';

export type Vars = { [string]: any };
export type VarsMatcher = (vars: Vars) => boolean;
export type VarsSetter = (vars: Vars) => Vars;

export type MachinatScript = {|
  $$typeof: MACHINAT_SCRIPT_TYPE,
  Init: MachinatComponentType,
  name: string,
  _commands: ScriptCommand[],
  _keyMapping: AccessKeyMapping,
|};

export type RenderScriptNode = (vars: Vars, props: Object) => MachinatNode;

export type MachinatScriptNode =
  | RenderScriptNode
  | {|
      $$typeof: Symbol,
      type: Symbol,
      props: any,
    |};

export type ContentSegment = {|
  type: 'content',
  key?: string,
  render: RenderScriptNode,
|};

export type IfSegment = {|
  type: 'if',
  key?: string,
  branches: {| condition: VarsMatcher, body: ScriptSegment[] |}[],
  fallback: void | ScriptSegment[],
|};

export type SwitchSegment = {|
  type: 'switch',
  key?: string,
  branches: {| case: string, body: ScriptSegment[] |}[],
  fallback: void | MachinatScriptNode,
|};

export type ForSegment = {|
  type: 'for',
  key?: string,
  varName?: string,
  getIterable: Vars => Iterator<any>,
  body: ScriptSegment[],
|};

export type WhileSegment = {|
  type: 'while',
  key?: string,
  condition: VarsMatcher,
  body: ScriptSegment[],
|};

export type SetVarsSegment = {|
  type: 'set_vars',
  setter: VarsSetter,
|};

export type PromptSegment = {|
  type: 'prompt',
  key: string,
  setter?: (vars: Vars, frame: any) => Vars,
|};

export type LabelSegment = {|
  type: 'label',
  key: string,
|};

export type CallSegment = {|
  type: 'call',
  script: MachinatScript,
  withVars?: Vars => Vars,
  gotoKey?: string,
  key?: string,
|};

export type ScriptSegment =
  | ContentSegment
  | SwitchSegment
  | IfSegment
  | ForSegment
  | WhileSegment
  | PromptSegment
  | SetVarsSegment
  | CallSegment
  | LabelSegment;

export type ContentCommand = {|
  type: 'content',
  render: RenderScriptNode,
|};

export type PromptCommand = {|
  type: 'prompt',
  setter?: (vars: Vars, frame: Object) => Vars,
|};

export type CallCommand = {|
  type: 'call',
  script: MachinatScript,
  withVars?: Vars => Vars,
  gotoKey?: string,
|};

export type SetVarsCommand = {|
  type: 'set_vars',
  setter: VarsSetter,
|};

export type JumpCommand = {
  type: 'jump',
  index: number,
};

export type JumpCondCommand = {|
  type: 'jump_cond',
  index: number,
  condition: VarsMatcher,
  isNot: boolean,
|};

export type ScriptCommand =
  | ContentCommand
  | JumpCommand
  | JumpCondCommand
  | PromptCommand
  | CallCommand
  | SetVarsCommand;

export type AccessKeyMapping = {
  [string]: number,
};

export type ScriptCallScope = {
  name: string,
  vars: Vars,
  stopping: number,
};

export type ScriptExecuteState = {
  version: 'V0',
  callStack: ScriptCallScope[],
};
