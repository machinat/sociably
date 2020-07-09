// @flow
/* eslint-disable no-use-before-define */
import typeof Machinat from '@machinat/core';
import type { ServiceContainer } from '@machinat/core/service/types';
import type {
  FunctionalComponent,
  MachinatNode,
  MachinatEmpty,
  MachinatElement,
  MachinatChannel,
} from '@machinat/core/types';
import typeof { MACHINAT_SCRIPT_TYPE } from './constant';

type InitScriptProps<Vars> = {
  channel: MachinatChannel,
  vars?: Vars,
  goto?: string,
};

export type MachinatScript<Vars, Input, RetrunValue, Meta> = {|
  $$typeof: MACHINAT_SCRIPT_TYPE,
  name: string,
  commands: ScriptCommand<Vars, Input, RetrunValue>[],
  entriesIndex: Map<string, number>,
  meta: Meta,
  Start: ServiceContainer<FunctionalComponent<InitScriptProps<Vars>>>,
|};

type ScriptCircumstances<Vars> = {
  platform: string,
  channel: MachinatChannel,
  vars: Vars,
};

export type RenderContentFn<Vars> = (
  circumstances: ScriptCircumstances<Vars>
) => MachinatNode | Promise<MachinatNode>;

export type RenderContentNode<Vars> =
  | RenderContentFn<Vars>
  | ServiceContainer<RenderContentFn<Vars>>;

export type ConditionMatchFn<Vars> = (
  circumstances: ScriptCircumstances<Vars>
) => boolean | Promise<boolean>;

export type ConditionMatcher<Vars> =
  | ConditionMatchFn<Vars>
  | ServiceContainer<ConditionMatchFn<Vars>>;

export type IfElementProps<Vars, Input, RetrunValue> = {
  condition: ConditionMatcher<Vars>,
  children: (
    | ThenElement<Vars, Input, RetrunValue>
    | ElseElement<Vars, Input, RetrunValue>
    | ElseIfElement<Vars, Input, RetrunValue>
  )[],
};

export type IfElement<Vars, Input, RetrunValue> = MachinatElement<
  IfElementProps<Vars, Input, RetrunValue>,
  Symbol
>;

export type ScriptChildrenProps<Vars, Input, RetrunValue> = {
  children: ScriptNode<Vars, Input, RetrunValue>,
};

export type ThenElement<Vars, Input, RetrunValue> = MachinatElement<
  ScriptChildrenProps<Vars, Input, RetrunValue>,
  Symbol
>;

export type ElseElement<Vars, Input, RetrunValue> = MachinatElement<
  ScriptChildrenProps<Vars, Input, RetrunValue>,
  Symbol
>;

export type ElseIfElementProps<Vars, Input, RetrunValue> = {
  condition: ConditionMatcher<Vars>,
  children: ScriptNode<Vars, Input, RetrunValue>,
};

export type ElseIfElement<Vars, Input, RetrunValue> = MachinatElement<
  ElseIfElementProps<Vars, Input, RetrunValue>,
  Symbol
>;

export type WhileElementProps<Vars, Input, RetrunValue> = {
  condition: ConditionMatcher<Vars>,
  children: ScriptNode<Vars, Input, RetrunValue>,
};

export type WhileElement<Vars, Input, RetrunValue> = MachinatElement<
  WhileElementProps<Vars, Input, RetrunValue>,
  Symbol
>;

export type PromptSetFn<Vars, Input> = (
  circumstances: ScriptCircumstances<Vars>,
  input: Input
) => Vars | Promise<Vars>;

export type PromptSetter<Vars, Input> =
  | PromptSetFn<Vars, Input>
  | ServiceContainer<PromptSetFn<Vars, Input>>;

export type PromptFilterPredecateFn<Vars, Input> = (
  circumstances: ScriptCircumstances<Vars>,
  input: Input
) => boolean | Promise<boolean>;

export type PromptFilterPredecator<Vars, Input> =
  | PromptFilterPredecateFn<Vars, Input>
  | ServiceContainer<PromptFilterPredecateFn<Vars, Input>>;

export type PromptElementProps<Vars, Input> = {
  key: string,
  set?: PromptSetter<Vars, Input>,
  filter?: PromptFilterPredecator<Vars, Input>,
};

export type PromptElement<Vars, Input> = MachinatElement<
  PromptElementProps<Vars, Input>,
  Symbol
>;

export type VarsSetFn<Vars> = (
  circumstances: ScriptCircumstances<Vars>
) => Vars | Promise<Vars>;

export type VarsSetter<Vars> =
  | VarsSetFn<Vars>
  | ServiceContainer<VarsSetFn<Vars>>;

export type VarsElementProps<Vars> = {
  set: VarsSetter<Vars>,
};

export type VarsElement<Vars> = MachinatElement<VarsElementProps<Vars>, Symbol>;

export type LabelElementProps = { key: string };
export type LabelElement = MachinatElement<LabelElementProps, Symbol>;

export type CallWithVarsFn<CallerVars, CalleeVars> = (
  circumstances: ScriptCircumstances<CallerVars>
) => CalleeVars | Promise<CalleeVars>;

export type CallWithVarsGetter<CallerVars, CalleeVars> =
  | CallWithVarsFn<CallerVars, CalleeVars>
  | ServiceContainer<CallWithVarsFn<CallerVars, CalleeVars>>;

export type CallReturnSetFn<CallerVars, RetrunValue> = (
  circumstances: ScriptCircumstances<CallerVars>,
  returnValue: RetrunValue
) => CallerVars | Promise<CallerVars>;

export type CallReturnSetter<CallerVars, RetrunValue> =
  | CallReturnSetFn<CallerVars, RetrunValue>
  | ServiceContainer<CallReturnSetFn<CallerVars, RetrunValue>>;

export type CallElementProps<CallerVars, CalleeVars, RetrunValue> = {
  script: MachinatScript<CallerVars, any, RetrunValue, any>,
  key: string,
  withVars?: CallWithVarsGetter<CallerVars, CalleeVars>,
  set?: CallReturnSetter<CallerVars, RetrunValue>,
  goto?: string,
};

export type CallElement<CallerVars, CalleeVars, RetrunValue> = MachinatElement<
  CallElementProps<CallerVars, CalleeVars, RetrunValue>,
  Symbol
>;

export type ReturnValueFn<Value> = (
  circumstances: ScriptCircumstances<any>
) => Value | Promise<Value>;

export type ReturnValueGetter<Value> =
  | ReturnValueFn<Value>
  | ServiceContainer<ReturnValueFn<Value>>;

export type ReturnElementProps<Value> = {
  value?: ReturnValueGetter<Value>,
};

export type ReturnElement<Value> = MachinatElement<
  ReturnElementProps<Value>,
  Symbol
>;

export type ScriptElement<Vars, Input, RetrunValue> =
  | IfElement<Vars, Input, RetrunValue>
  | WhileElement<Vars, Input, RetrunValue>
  | PromptElement<Vars, Input>
  | VarsElement<Vars>
  | LabelElement
  | CallElement<Vars, any, any>
  | ReturnElement<RetrunValue>;

export type ScriptNode<Vars, Input, RetrunValue> =
  | MachinatEmpty
  | RenderContentNode<Vars>
  | ScriptElement<Vars, Input, RetrunValue>
  | ScriptElement<Vars, Input, RetrunValue>[]
  | MachinatElement<
      { children: ScriptNode<Vars, Input, RetrunValue> },
      $PropertyType<Machinat, 'Fragment'>
    >;

export type ContentSegment<Vars> = {|
  type: 'content',
  render: RenderContentNode<Vars>,
|};

export type ConditionsSegment<Vars> = {|
  type: 'conditions',
  branches: {|
    condition: ConditionMatcher<Vars>,
    body: ScriptSegment<Vars>[],
  |}[],
  fallbackBody: null | ScriptSegment<Vars, any, any>[],
|};

export type WhileSegment<Vars> = {|
  type: 'while',
  condition: ConditionMatcher<Vars>,
  body: ScriptSegment<Vars, any, any>[],
|};

export type SetVarsSegment<Vars> = {|
  type: 'set_vars',
  setter: VarsSetter<Vars>,
|};

export type PromptSegment<Vars, Input> = {|
  type: 'prompt',
  key: string,
  setter: ?PromptSetter<Vars, Input>,
  filter?: PromptFilterPredecator<Vars, Input>,
|};

export type LabelSegment = {|
  type: 'label',
  key: string,
|};

export type CallSegment<CallerVars, CalleeVars, RetrunValue> = {|
  type: 'call',
  script: MachinatScript<CalleeVars, any, RetrunValue, any>,
  key: string,
  withVars: ?CallWithVarsGetter<CallerVars, CalleeVars>,
  setter: ?CallReturnSetter<CallerVars, RetrunValue>,
  goto: void | string,
|};

export type ReturnSegment<Value> = {|
  type: 'return',
  valueGetter: ?ReturnValueGetter<Value>,
|};

export type ScriptSegment<Vars, Input, RetrunValue> =
  | ContentSegment<Vars>
  | ConditionsSegment<Vars>
  | WhileSegment<Vars>
  | PromptSegment<Vars, Input>
  | SetVarsSegment<Vars>
  | CallSegment<Vars, any, any>
  | LabelSegment
  | ReturnSegment<RetrunValue>;

export type ContentCommand<Vars> = {|
  type: 'content',
  render: RenderContentNode<Vars>,
|};

export type PromptCommand<Vars, Input> = {|
  type: 'prompt',
  key: string,
  setter: ?PromptSetter<Vars, Input>,
  filter?: PromptFilterPredecator<Vars, Input>,
|};

export type CallCommand<CallerVars, CalleeVars, RetrunValue> = {|
  type: 'call',
  key: string,
  script: MachinatScript<CalleeVars, any, RetrunValue, any>,
  withVars: ?CallWithVarsGetter<CallerVars, CalleeVars>,
  setter: ?CallReturnSetter<CallerVars, RetrunValue>,
  goto: void | string,
|};

export type SetVarsCommand<Vars> = {|
  type: 'set_vars',
  setter: VarsSetter<Vars>,
|};

export type JumpCommand = {|
  type: 'jump',
  offset: number,
|};

export type JumpCondCommand<Vars> = {|
  type: 'jump_cond',
  offset: number,
  condition: ConditionMatcher<Vars>,
  isNot: boolean,
|};

export type ReturnCommand<Value> = {|
  type: 'return',
  valueGetter: ?ReturnValueGetter<Value>,
|};

export type ScriptCommand<Vars, Input, RetrunValue> =
  | ContentCommand<Vars>
  | JumpCommand
  | JumpCondCommand<Vars>
  | PromptCommand<Vars, Input>
  | CallCommand<Vars, any, any>
  | SetVarsCommand<Vars>
  | ReturnCommand<RetrunValue>;

export type CallStatus<Vars, Input, RetrunValue> = {
  script: MachinatScript<Vars, Input, RetrunValue, any>,
  vars: Vars,
  stopAt: void | string,
};

export type SerializedCallStatus<Vars> = {
  name: string,
  vars: Vars,
  stopAt: string,
};

export type ScriptProcessState = {
  version: 'V0',
  timestamp: number,
  callStack: SerializedCallStatus<any>[],
};
