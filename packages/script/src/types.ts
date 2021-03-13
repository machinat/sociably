import type Machinat from '@machinat/core';
import type {
  ThunkEffectFn,
  MachinatNode,
  MachinatEmpty,
  MachinatElement,
  MachinatChannel,
} from '@machinat/core/types';
import type { MaybeContainer } from '@machinat/core/service/types';

import { MACHINAT_SCRIPT_TYPE } from './constant';
import type {
  IF,
  THEN,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  VARS,
  LABEL,
  CALL,
  EFFECT,
  RETURN,
} from './keyword';

export type ScriptLibrary<Vars, Input, Return, Meta> = {
  $$typeof: typeof MACHINAT_SCRIPT_TYPE;
  name: string;
  commands: ScriptCommand<Vars, Input, Return>[];
  initiateVars: (input: Partial<Vars>) => Vars;
  stopPointIndex: Map<string, number>;
  meta: Meta;
};

export type AnyScriptLibrary = ScriptLibrary<
  unknown,
  unknown,
  unknown,
  unknown
>;

export type ScriptCircs<Vars> = {
  platform: string;
  channel: MachinatChannel;
  vars: Vars;
};

export type ContentFn<Vars> = (
  circs: ScriptCircs<Vars>
) => MachinatNode | Promise<MachinatNode>;

export type ContentNode<Vars> = MaybeContainer<ContentFn<Vars>>;

export type ConditionMatchFn<Vars> = (
  circs: ScriptCircs<Vars>
) => boolean | Promise<boolean>;

export type ConditionMatcher<Vars> = MaybeContainer<ConditionMatchFn<Vars>>;

type ConditionBlocks<Vars, Input, Return> =
  | ThenElement<Vars, Input, Return>
  | ElseElement<Vars, Input, Return>
  | ElseIfElement<Vars, Input, Return>;

/**
 * @category Keyword Props
 */
export type IfProps<Vars, Input, Return> = {
  condition: ConditionMatcher<Vars>;
  children:
    | ConditionBlocks<Vars, Input, Return>
    | ConditionBlocks<Vars, Input, Return>[];
};

/**
 * @category Keyword Element
 */
export type IfElement<Vars, Input, Return> = MachinatElement<
  IfProps<Vars, Input, Return>,
  typeof IF
>;

/**
 * @category Keyword Props
 */
export type BlockProps<Vars, Input, Return> = {
  children: ScriptNode<Vars, Input, Return>;
};

/**
 * @category Keyword Element
 */
export type ThenElement<Vars, Input, Return> = MachinatElement<
  BlockProps<Vars, Input, Return>,
  typeof THEN
>;

/**
 * @category Keyword Element
 */
export type ElseElement<Vars, Input, Return> = MachinatElement<
  BlockProps<Vars, Input, Return>,
  typeof ELSE
>;

/**
 * @category Keyword Props
 */
export type ElseIfProps<Vars, Input, Return> = {
  condition: ConditionMatcher<Vars>;
  children: ScriptNode<Vars, Input, Return>;
};

/**
 * @category Keyword Element
 */
export type ElseIfElement<Vars, Input, Return> = MachinatElement<
  ElseIfProps<Vars, Input, Return>,
  typeof ELSE_IF
>;

/**
 * @category Keyword Props
 */
export type WhileProps<Vars, Input, Return> = {
  condition: ConditionMatcher<Vars>;
  children: ScriptNode<Vars, Input, Return>;
};

/**
 * @category Keyword Element
 */
export type WhileElement<Vars, Input, Return> = MachinatElement<
  WhileProps<Vars, Input, Return>,
  typeof WHILE
>;

export type PromptSetFn<Vars, Input> = (
  circs: ScriptCircs<Vars>,
  input: Input
) => Vars | Promise<Vars>;

export type PromptSetter<Vars, Input> = MaybeContainer<
  PromptSetFn<Vars, Input>
>;

export type PromptFilterPredecateFn<Vars, Input> = (
  circs: ScriptCircs<Vars>,
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
  typeof PROMPT
>;

export type VarsSetFn<Vars> = (
  circs: ScriptCircs<Vars>
) => Vars | Promise<Vars>;

export type VarsSetter<Vars> = MaybeContainer<VarsSetFn<Vars>>;

/**
 * @category Keyword Props
 */
export type VarsProps<Vars> = {
  set: VarsSetter<Vars>;
};

/**
 * @category Keyword Element
 */
export type VarsElement<Vars> = MachinatElement<VarsProps<Vars>, typeof VARS>;

/**
 * @category Keyword Props
 */
export type LabelProps = { key: string };

/**
 * @category Keyword Element
 */
export type LabelElement = MachinatElement<LabelProps, typeof LABEL>;

export type CallWithVarsFn<CallerVars, CalleeVars> = (
  circs: ScriptCircs<CallerVars>
) => Partial<CalleeVars> | Promise<Partial<CalleeVars>>;

export type CallVarsGetter<CallerVars, CalleeVars> = MaybeContainer<
  CallWithVarsFn<CallerVars, CalleeVars>
>;

export type CallReturnSetFn<CallerVars, Return> = (
  circs: ScriptCircs<CallerVars>,
  returnValue: Return
) => CallerVars | Promise<CallerVars>;

export type CallReturnSetter<CallerVars, Return> = MaybeContainer<
  CallReturnSetFn<CallerVars, Return>
>;

/**
 * @category Keyword Props
 */
export type CallProps<CallerVars, CalleeVars, Return> = {
  script: ScriptLibrary<CalleeVars, unknown, Return, unknown>;
  key: string;
  withVars?: CallVarsGetter<CallerVars, CalleeVars>;
  set?: CallReturnSetter<CallerVars, Return>;
  goto?: string;
};

/**
 * @category Keyword Element
 */
export type CallElement<CallerVars, CalleeVars, Return> = MachinatElement<
  CallProps<CallerVars, CalleeVars, Return>,
  typeof CALL
>;

export type DoEffectFn<Vars> = (
  circs: ScriptCircs<Vars>
) => ThunkEffectFn | Promise<ThunkEffectFn>;

export type EffectDoer<Vars> = MaybeContainer<DoEffectFn<Vars>>;

/**
 * @category Keyword Props
 */
export type EffectProps<Vars> = {
  do: EffectDoer<Vars>;
};

/**
 * @category Keyword Element
 */
export type EffectElement<Vars> = MachinatElement<
  EffectProps<Vars>,
  typeof EFFECT
>;

export type ReturnValueFn<Vars, Return> = (
  circs: ScriptCircs<Vars>
) => Return | Promise<Return>;

export type ReturnValueGetter<Vars, Return> = MaybeContainer<
  ReturnValueFn<Vars, Return>
>;

/**
 * @category Keyword Props
 */
export type ReturnProps<Vars, Return> = {
  value?: ReturnValueGetter<Vars, Return>;
};

/**
 * @category Keyword Element
 */
export type ReturnElement<Vars, Return> = MachinatElement<
  ReturnProps<Vars, Return>,
  typeof RETURN
>;

export type ScriptElement<Vars, Input, Return> =
  | IfElement<Vars, Input, Return>
  | WhileElement<Vars, Input, Return>
  | PromptElement<Vars, Input>
  | VarsElement<Vars>
  | LabelElement
  | CallElement<Vars, unknown, unknown>
  | ReturnElement<Vars, Return>;

export type ScriptNode<Vars, Input, Return> =
  | MachinatEmpty
  | ContentNode<Vars>
  | ScriptElement<Vars, Input, Return>
  | ScriptNode<Vars, Input, Return>[]
  | MachinatElement<
      { children: ScriptNode<Vars, Input, Return> },
      typeof Machinat.Fragment
    >;

/** @internal */
export type ConditionsSegment<Vars> = {
  type: 'conditions';
  branches: {
    condition: ConditionMatcher<Vars>;
    body: ScriptSegment<Vars, unknown, unknown>[];
  }[];
  fallbackBody: null | ScriptSegment<Vars, unknown, unknown>[];
};

/** @internal */
export type WhileSegment<Vars> = {
  type: 'while';
  condition: ConditionMatcher<Vars>;
  body: ScriptSegment<Vars, unknown, unknown>[];
};

/** @internal */
export type LabelSegment = {
  type: 'label';
  key: string;
};

export type ContentCommand<Vars> = {
  type: 'content';
  getContent: ContentNode<Vars>;
};

export type PromptCommand<Vars, Input> = {
  type: 'prompt';
  key: string;
  setVars: PromptSetter<Vars, Input> | null | undefined;
};

export type CallCommand<CallerVars, CalleeVars, Return> = {
  type: 'call';
  key: string;
  script: ScriptLibrary<CalleeVars, unknown, Return, unknown>;
  withVars: CallVarsGetter<CallerVars, CalleeVars> | null | undefined;
  setVars: CallReturnSetter<CallerVars, Return> | null | undefined;
  goto: undefined | string;
};

export type VarsCommand<Vars> = {
  type: 'vars';
  setVars: VarsSetter<Vars>;
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

export type EffectCommand<Vars> = {
  type: 'effect';
  doEffect: EffectDoer<Vars>;
};

export type ReturnCommand<Vars, Return> = {
  type: 'return';
  getValue: ReturnValueGetter<Vars, Return> | null | undefined;
};

/** @internal */
export type ScriptSegment<Vars, Input, Return> =
  | ContentCommand<Vars>
  | ConditionsSegment<Vars>
  | WhileSegment<Vars>
  | PromptCommand<Vars, Input>
  | VarsCommand<Vars>
  | CallCommand<Vars, unknown, unknown>
  | EffectCommand<Vars>
  | LabelSegment
  | ReturnCommand<Vars, Return>;

export type ScriptCommand<Vars, Input, Return> =
  | ContentCommand<Vars>
  | JumpCommand
  | JumpCondCommand<Vars>
  | PromptCommand<Vars, Input>
  | CallCommand<Vars, unknown, unknown>
  | VarsCommand<Vars>
  | EffectCommand<Vars>
  | ReturnCommand<Vars, Return>;

export type CallStatus<Vars, Input, Return> = {
  script: ScriptLibrary<Vars, Input, Return, unknown>;
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
  callStack: SerializedCallStatus<unknown>[];
};
