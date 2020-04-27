// @flow
/* eslint-disable no-use-before-define */
import typeof Machinat from '@machinat/core';
import type {
  MachinatNode,
  MachinatEmpty,
  MachinatElement,
  FunctionalComponent,
  MachinatChannel,
} from '@machinat/core/types';
import typeof { MACHINAT_SCRIPT_TYPE } from './constant';
import ScriptProcessor from './processor';

export type VarsMatcher<Vars> = (vars: Vars) => boolean;

type InitScriptProps<Vars, Input> = {
  channel: MachinatChannel,
  processor: ScriptProcessor<Vars, Input>,
  goto?: string,
  vars: Vars,
};

export type MachinatScript<Vars, Input> = {|
  $$typeof: MACHINAT_SCRIPT_TYPE,
  Init: FunctionalComponent<InitScriptProps<Vars, Input>>,
  name: string,
  commands: ScriptCommand<Vars, Input>[],
  entryPointIndex: Map<string, number>,
|};

export type RenderContentNode<Vars> = (vars: Vars) => MachinatNode;

export type IfElementProps<Vars, Input> = {
  condition: VarsMatcher<Vars>,
  children: (
    | ThenElement<Vars, Input>
    | ElseElement<Vars, Input>
    | ElseIfElement<Vars, Input>
  )[],
};

export type IfElement<Vars, Input> = MachinatElement<
  IfElementProps<Vars, Input>,
  Symbol
>;

export type ScriptChildrenProps<Vars, Input> = {
  children: ScriptNode<Vars, Input>,
};

export type ThenElement<Vars, Input> = MachinatElement<
  ScriptChildrenProps<Vars, Input>,
  Symbol
>;

export type ElseElement<Vars, Input> = MachinatElement<
  ScriptChildrenProps<Vars, Input>,
  Symbol
>;

export type ElseIfElementProps<Vars, Input> = {
  condition: VarsMatcher<Vars>,
  children: ScriptNode<Vars, Input>,
};

export type ElseIfElement<Vars, Input> = MachinatElement<
  ElseIfElementProps<Vars, Input>,
  Symbol
>;

export type WhileElementProps<Vars, Input> = {
  condition: VarsMatcher<Vars>,
  children: ScriptNode<Vars, Input>,
};

export type WhileElement<Vars, Input> = MachinatElement<
  WhileElementProps<Vars, Input>,
  Symbol
>;

export type PromptElementProps<Vars, Input> = {
  set: (vars: Vars, input: Input) => Vars,
  key: string,
};

export type PromptElement<Vars, Input> = MachinatElement<
  PromptElementProps<Vars, Input>,
  Symbol
>;

export type VarsElementProps<Vars> = {
  set: (vars: Vars) => Vars,
};

export type VarsElement<Vars> = MachinatElement<VarsElementProps<Vars>, Symbol>;

export type LabelElementProps = { key: string };
export type LabelElement = MachinatElement<LabelElementProps, Symbol>;

export type CallElementProps<CallerVars, CalleeVars> = {
  script: MachinatScript<CallerVars, any>,
  key: string,
  withVars?: CallerVars => CalleeVars,
  set?: (CallerVars, CalleeVars) => CallerVars,
  goto?: string,
};

export type CallElement<CallerVars, CalleeVars> = MachinatElement<
  CallElementProps<CallerVars, CalleeVars>,
  Symbol
>;

export type ReturnElement = MachinatElement<{}, Symbol>;

export type ScriptElement<Vars, Input> =
  | IfElement<Vars, Input>
  | WhileElement<Vars, Input>
  | PromptElement<Vars, Input>
  | VarsElement<Vars>
  | LabelElement
  | CallElement<Vars, any>
  | ReturnElement;

export type ScriptNode<Vars, Input> =
  | MachinatEmpty
  | RenderContentNode<Vars>
  | ScriptElement<Vars, Input>
  | ScriptElement<Vars, Input>[]
  | MachinatElement<
      { children: ScriptNode<Vars, Input> },
      $PropertyType<Machinat, 'Fragment'>
    >;

export type ContentSegment<Vars> = {|
  type: 'content',
  render: RenderContentNode<Vars>,
|};

export type IfSegment<Vars> = {|
  type: 'if',
  branches: {|
    condition: VarsMatcher<Vars>,
    body: ScriptSegment<Vars>[],
  |}[],
  fallback: void | ScriptSegment<Vars>[],
|};

export type SwitchSegment<Vars> = {|
  type: 'switch',
  branches: {| case: string, body: ScriptSegment<Vars>[] |}[],
  fallback: void | ScriptNode<Vars>,
|};

export type WhileSegment<Vars> = {|
  type: 'while',
  condition: VarsMatcher<Vars>,
  body: ScriptSegment<Vars>[],
|};

export type SetVarsSegment<Vars> = {|
  type: 'set_vars',
  setter: (vars: Vars) => Vars,
|};

export type PromptSegment<Vars> = {|
  type: 'prompt',
  key: string,
  setter?: (vars: Vars, input: any) => Vars,
|};

export type LabelSegment = {|
  type: 'label',
  key: string,
|};

export type CallSegment<CallerVars, CalleeVars> = {|
  type: 'call',
  script: MachinatScript<CalleeVars, any>,
  key: string,
  withVars?: CallerVars => CalleeVars,
  setter?: (CallerVars, CalleeVars) => CallerVars,
  goto?: string,
|};

export type ReturnSegment = {|
  type: 'return',
|};

export type ScriptSegment<Vars> =
  | ContentSegment<Vars>
  | SwitchSegment<Vars>
  | IfSegment<Vars>
  | WhileSegment<Vars>
  | PromptSegment<Vars>
  | SetVarsSegment<Vars>
  | CallSegment<Vars, any>
  | LabelSegment
  | ReturnSegment;

export type ContentCommand<Vars> = {|
  type: 'content',
  render: RenderContentNode<Vars>,
|};

export type PromptCommand<Vars, Input> = {|
  type: 'prompt',
  key: string,
  setter?: (vars: Vars, intput: Input) => Vars,
|};

export type CallCommand<CallerVars, CalleeVars> = {|
  type: 'call',
  key: string,
  script: MachinatScript<CalleeVars, any>,
  withVars?: CallerVars => CalleeVars,
  setter?: (CallerVars, CalleeVars) => CallerVars,
  goto?: string,
|};

export type SetVarsCommand<Vars> = {|
  type: 'set_vars',
  setter: (vars: Vars) => Vars,
|};

export type JumpCommand = {|
  type: 'jump',
  offset: number,
|};

export type JumpCondCommand<Vars> = {|
  type: 'jump_cond',
  offset: number,
  condition: VarsMatcher<Vars>,
  isNot: boolean,
|};

export type ReturnCommand = {|
  type: 'return',
|};

export type ScriptCommand<Vars, Input> =
  | ContentCommand<Vars>
  | JumpCommand
  | JumpCondCommand<Vars>
  | PromptCommand<Vars, Input>
  | CallCommand<Vars, any>
  | SetVarsCommand<Vars>
  | ReturnCommand;

export type CallStatus<Vars, Input> = {
  script: MachinatScript<Vars, Input>,
  vars: Vars,
  stoppedAt: void | string,
};

export type SerializedCallStatus<Vars> = {
  name: string,
  vars: Vars,
  stoppedAt: string,
};

export type ScriptProcessState<Vars> = {
  version: 'V0',
  timestamp: number,
  callStack: SerializedCallStatus<Vars>[],
};
