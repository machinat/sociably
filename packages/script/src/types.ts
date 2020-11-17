import type Machinat from '@machinat/core';
import type { ServiceContainer } from '@machinat/core/service/types';
import type {
  MachinatNode,
  MachinatEmpty,
  MachinatElement,
  MachinatChannel,
} from '@machinat/core/types';
import type { MACHINAT_SCRIPT_TYPE } from './constant';
import type * as KEYWORDS from './keyword';

export type MachinatScript<Vars, Input, RetrunValue, Meta> = {
  $$typeof: typeof MACHINAT_SCRIPT_TYPE;
  name: string;
  commands: ScriptCommand<Vars, Input, RetrunValue>[];
  entriesIndex: Map<string, number>;
  meta: Meta;
};

type ScriptCircumstances<Vars> = {
  platform: string;
  channel: MachinatChannel;
  vars: Vars;
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

/**
 * @category Keyword Props
 */
export type IfProps<Vars, Input, RetrunValue> = {
  condition: ConditionMatcher<Vars>;
  children: (
    | ThenElement<Vars, Input, RetrunValue>
    | ElseElement<Vars, Input, RetrunValue>
    | ElseIfElement<Vars, Input, RetrunValue>
  )[];
};

/**
 * @category Keyword Element
 */
export type IfElement<Vars, Input, RetrunValue> = MachinatElement<
  IfProps<Vars, Input, RetrunValue>,
  typeof KEYWORDS.IF
>;

/**
 * @category Keyword Props
 */
export type ScriptChildrenProps<Vars, Input, RetrunValue> = {
  children: ScriptNode<Vars, Input, RetrunValue>;
};

/**
 * @category Keyword Element
 */
export type ThenElement<Vars, Input, RetrunValue> = MachinatElement<
  ScriptChildrenProps<Vars, Input, RetrunValue>,
  typeof KEYWORDS.THEN
>;

/**
 * @category Keyword Element
 */
export type ElseElement<Vars, Input, RetrunValue> = MachinatElement<
  ScriptChildrenProps<Vars, Input, RetrunValue>,
  typeof KEYWORDS.ELSE
>;

/**
 * @category Keyword Props
 */
export type ElseIfProps<Vars, Input, RetrunValue> = {
  condition: ConditionMatcher<Vars>;
  children: ScriptNode<Vars, Input, RetrunValue>;
};

/**
 * @category Keyword Element
 */
export type ElseIfElement<Vars, Input, RetrunValue> = MachinatElement<
  ElseIfProps<Vars, Input, RetrunValue>,
  typeof KEYWORDS.ELSE_IF
>;

/**
 * @category Keyword Props
 */
export type WhileProps<Vars, Input, RetrunValue> = {
  condition: ConditionMatcher<Vars>;
  children: ScriptNode<Vars, Input, RetrunValue>;
};

/**
 * @category Keyword Element
 */
export type WhileElement<Vars, Input, RetrunValue> = MachinatElement<
  WhileProps<Vars, Input, RetrunValue>,
  typeof KEYWORDS.WHILE
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

/**
 * @category Keyword Props
 */
export type PromptProps<Vars, Input> = {
  key: string;
  set?: PromptSetter<Vars, Input>;
};

/**
 * @category Keyword Element
 */
export type PromptElement<Vars, Input> = MachinatElement<
  PromptProps<Vars, Input>,
  typeof KEYWORDS.PROMPT
>;

export type VarsSetFn<Vars> = (
  circumstances: ScriptCircumstances<Vars>
) => Vars | Promise<Vars>;

export type VarsSetter<Vars> =
  | VarsSetFn<Vars>
  | ServiceContainer<VarsSetFn<Vars>>;

/**
 * @category Keyword Props
 */
export type VarsProps<Vars> = {
  set: VarsSetter<Vars>;
};

/**
 * @category Keyword Element
 */
export type VarsElement<Vars> = MachinatElement<
  VarsProps<Vars>,
  typeof KEYWORDS.VARS
>;

/**
 * @category Keyword Props
 */
export type LabelProps = { key: string };

/**
 * @category Keyword Element
 */
export type LabelElement = MachinatElement<LabelProps, typeof KEYWORDS.LABEL>;

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

/**
 * @category Keyword Props
 */
export type CallProps<CallerVars, CalleeVars, RetrunValue> = {
  script: MachinatScript<CallerVars, any, RetrunValue, any>;
  key: string;
  withVars?: CallWithVarsGetter<CallerVars, CalleeVars>;
  set?: CallReturnSetter<CallerVars, RetrunValue>;
  goto?: string;
};

/**
 * @category Keyword Element
 */
export type CallElement<CallerVars, CalleeVars, RetrunValue> = MachinatElement<
  CallProps<CallerVars, CalleeVars, RetrunValue>,
  typeof KEYWORDS.CALL
>;

export type ReturnValueFn<Value> = (
  circumstances: ScriptCircumstances<any>
) => Value | Promise<Value>;

export type ReturnValueGetter<Value> =
  | ReturnValueFn<Value>
  | ServiceContainer<ReturnValueFn<Value>>;

/**
 * @category Keyword Props
 */
export type ReturnProps<Value> = {
  value?: ReturnValueGetter<Value>;
};

/**
 * @category Keyword Element
 */
export type ReturnElement<Value> = MachinatElement<
  ReturnProps<Value>,
  typeof KEYWORDS.RETURN
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
      typeof Machinat.Fragment
    >;

/** @internal */
export type ContentSegment<Vars> = {
  type: 'content';
  render: RenderContentNode<Vars>;
};

/** @internal */
export type ConditionsSegment<Vars> = {
  type: 'conditions';
  branches: {
    condition: ConditionMatcher<Vars>;
    body: ScriptSegment<Vars, any, any>[];
  }[];
  fallbackBody: null | ScriptSegment<Vars, any, any>[];
};

/** @internal */
export type WhileSegment<Vars> = {
  type: 'while';
  condition: ConditionMatcher<Vars>;
  body: ScriptSegment<Vars, any, any>[];
};

/** @internal */
export type SetVarsSegment<Vars> = {
  type: 'set_vars';
  setter: VarsSetter<Vars>;
};

/** @internal */
export type PromptSegment<Vars, Input> = {
  type: 'prompt';
  key: string;
  setter: PromptSetter<Vars, Input> | null | undefined;
};

/** @internal */
export type LabelSegment = {
  type: 'label';
  key: string;
};

/** @internal */
export type CallSegment<CallerVars, CalleeVars, RetrunValue> = {
  type: 'call';
  script: MachinatScript<CalleeVars, any, RetrunValue, any>;
  key: string;
  withVars: CallWithVarsGetter<CallerVars, CalleeVars> | null | undefined;
  setter: CallReturnSetter<CallerVars, RetrunValue> | null | undefined;
  goto: undefined | string;
};

/** @internal */
export type ReturnSegment<Value> = {
  type: 'return';
  valueGetter: ReturnValueGetter<Value> | null | undefined;
};

/** @internal */
export type ScriptSegment<Vars, Input, RetrunValue> =
  | ContentSegment<Vars>
  | ConditionsSegment<Vars>
  | WhileSegment<Vars>
  | PromptSegment<Vars, Input>
  | SetVarsSegment<Vars>
  | CallSegment<Vars, any, any>
  | LabelSegment
  | ReturnSegment<RetrunValue>;

export type ContentCommand<Vars> = {
  type: 'content';
  render: RenderContentNode<Vars>;
};

export type PromptCommand<Vars, Input> = {
  type: 'prompt';
  key: string;
  setter: PromptSetter<Vars, Input> | null | undefined;
};

export type CallCommand<CallerVars, CalleeVars, RetrunValue> = {
  type: 'call';
  key: string;
  script: MachinatScript<CalleeVars, any, RetrunValue, any>;
  withVars: CallWithVarsGetter<CallerVars, CalleeVars> | null | undefined;
  setter: CallReturnSetter<CallerVars, RetrunValue> | null | undefined;
  goto: undefined | string;
};

export type SetVarsCommand<Vars> = {
  type: 'set_vars';
  setter: VarsSetter<Vars>;
};

export type JumpCommand = {
  type: 'jump';
  offset: number;
};

export type JumpCondCommand<Vars> = {
  type: 'jump_cond';
  offset: number;
  condition: ConditionMatcher<Vars>;
  isNot: boolean;
};

export type ReturnCommand<Value> = {
  type: 'return';
  valueGetter: ReturnValueGetter<Value> | null | undefined;
};

export type ScriptCommand<Vars, Input, RetrunValue> =
  | ContentCommand<Vars>
  | JumpCommand
  | JumpCondCommand<Vars>
  | PromptCommand<Vars, Input>
  | CallCommand<Vars, any, any>
  | SetVarsCommand<Vars>
  | ReturnCommand<RetrunValue>;

export type CallStatus<Vars, Input, RetrunValue> = {
  script: MachinatScript<Vars, Input, RetrunValue, any>;
  vars: Vars;
  stopAt: undefined | string;
};

export type SerializedCallStatus<Vars> = {
  name: string;
  vars: Vars;
  stopAt: string;
};

export type ScriptProcessState = {
  version: 'V0';
  timestamp: number;
  callStack: SerializedCallStatus<any>[];
};
