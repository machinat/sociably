import Sociably, {
  SociablyNode,
  SociablyEmpty,
  SociablyElement,
  SociablyChannel,
  ContainerComponent,
} from '@sociably/core';

import type { MaybeContainer } from '@sociably/core/service';

import { SOCIABLY_SCRIPT_TYPE } from './constant';
import type {
  IF,
  THEN,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  LABEL,
  CALL,
  EFFECT,
  RETURN,
} from './keyword';

type StartScriptProps<Params> = {
  params?: Params;
  goto?: string;
};

export type ScriptLibrary<Vars, Input, Params, Return, Yield> = {
  $$typeof: typeof SOCIABLY_SCRIPT_TYPE;
  Start: ContainerComponent<StartScriptProps<Params>>;
  commands: ScriptCommand<Vars, Input, Return, Yield>[];
  initVars: (params: Params) => Vars;
  name: string;
  stopPointIndex: Map<string, number>;
};

export type AnyScriptLibrary = ScriptLibrary<any, any, any, any, any>;

export type ScriptCircs<Vars> = {
  platform: string;
  channel: SociablyChannel;
  vars: Vars;
};

export type ContentFn<Vars> = (
  circs: ScriptCircs<Vars>
) => SociablyNode | Promise<SociablyNode>;

export type ContentNode<Vars> = MaybeContainer<ContentFn<Vars>>;

export type ConditionMatchFn<Vars> = (
  circs: ScriptCircs<Vars>
) => boolean | Promise<boolean>;

export type ConditionMatcher<Vars> = MaybeContainer<ConditionMatchFn<Vars>>;

type ConditionBlocks<Vars, Input, Return, Yield> =
  | ThenElement<Vars, Input, Return, Yield>
  | ElseElement<Vars, Input, Return, Yield>
  | ElseIfElement<Vars, Input, Return, Yield>;

/**
 * @category Keyword Props
 */
export type IfProps<Vars, Input, Return, Yield> = {
  condition: ConditionMatcher<Vars>;
  children:
    | ConditionBlocks<Vars, Input, Return, Yield>
    | ConditionBlocks<Vars, Input, Return, Yield>[];
};

/**
 * @category Keyword Element
 */
export type IfElement<Vars, Input, Return, Yield> = SociablyElement<
  IfProps<Vars, Input, Return, Yield>,
  typeof IF
>;

/**
 * @category Keyword Props
 */
export type BlockProps<Vars, Input, Return, Yield> = {
  children: ScriptNode<Vars, Input, Return, Yield>;
};

/**
 * @category Keyword Element
 */
export type ThenElement<Vars, Input, Return, Yield> = SociablyElement<
  BlockProps<Vars, Input, Return, Yield>,
  typeof THEN
>;

/**
 * @category Keyword Element
 */
export type ElseElement<Vars, Input, Return, Yield> = SociablyElement<
  BlockProps<Vars, Input, Return, Yield>,
  typeof ELSE
>;

/**
 * @category Keyword Props
 */
export type ElseIfProps<Vars, Input, Return, Yield> = {
  condition: ConditionMatcher<Vars>;
  children: ScriptNode<Vars, Input, Return, Yield>;
};

/**
 * @category Keyword Element
 */
export type ElseIfElement<Vars, Input, Return, Yield> = SociablyElement<
  ElseIfProps<Vars, Input, Return, Yield>,
  typeof ELSE_IF
>;

/**
 * @category Keyword Props
 */
export type WhileProps<Vars, Input, Return, Yield> = {
  condition: ConditionMatcher<Vars>;
  children: ScriptNode<Vars, Input, Return, Yield>;
};

/**
 * @category Keyword Element
 */
export type WhileElement<Vars, Input, Return, Yield> = SociablyElement<
  WhileProps<Vars, Input, Return, Yield>,
  typeof WHILE
>;

export type PromptSetFn<Vars, Input> = (
  circs: ScriptCircs<Vars>,
  input: Input
) => Vars | Promise<Vars>;

export type PromptSetter<Vars, Input> = MaybeContainer<
  PromptSetFn<Vars, Input>
>;

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
export type PromptElement<Vars, Input> = SociablyElement<
  PromptProps<Vars, Input>,
  typeof PROMPT
>;

/**
 * @category Keyword Props
 */
export type LabelProps = { key: string };

/**
 * @category Keyword Element
 */
export type LabelElement = SociablyElement<LabelProps, typeof LABEL>;

export type CallParamsFn<Vars, Params> = (
  circs: ScriptCircs<Vars>
) => Params | Promise<Params>;

export type CallParamsGetter<Vars, Params> = MaybeContainer<
  CallParamsFn<Vars, Params>
>;

export type CallReturnSetFn<Vars, Return> = (
  circs: ScriptCircs<Vars>,
  returnValue: Return
) => Vars | Promise<Vars>;

export type CallReturnSetter<Vars, Return> = MaybeContainer<
  CallReturnSetFn<Vars, Return>
>;

/**
 * @category Keyword Props
 */
export type CallProps<
  Vars,
  Script extends AnyScriptLibrary
> = Script extends ScriptLibrary<
  unknown,
  unknown,
  infer Params,
  infer Return,
  unknown
>
  ? {
      script: Script;
      key: string;
      params?: CallParamsGetter<Vars, Params>;
      set?: CallReturnSetter<Vars, Return>;
      goto?: string;
    }
  : never;

/**
 * @category Keyword Element
 */
export type CallElement<
  Vars,
  Script extends AnyScriptLibrary
> = SociablyElement<CallProps<Vars, Script>, typeof CALL>;

export type EffectSetFn<Vars> = (
  circs: ScriptCircs<Vars>
) => Vars | Promise<Vars>;

export type EffectSetter<Vars> = MaybeContainer<EffectSetFn<Vars>>;

export type EffectYieldFn<Vars, Yield> = (
  circs: ScriptCircs<Vars>,
  prevValue: undefined | Yield
) => Yield | Promise<Yield>;

export type EffectYielder<Vars, Yield> = MaybeContainer<
  EffectYieldFn<Vars, Yield>
>;

/**
 * @category Keyword Props
 */
export type EffectProps<Vars, Yield> = {
  set?: EffectSetter<Vars>;
  yield?: EffectYielder<Vars, Yield>;
};

/**
 * @category Keyword Element
 */
export type EffectElement<Vars, Yield> = SociablyElement<
  EffectProps<Vars, Yield>,
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
export type ReturnElement<Vars, Return> = SociablyElement<
  ReturnProps<Vars, Return>,
  typeof RETURN
>;

export type ScriptElement<Vars, Input, Return, Yield> =
  | IfElement<Vars, Input, Return, Yield>
  | WhileElement<Vars, Input, Return, Yield>
  | PromptElement<Vars, Input>
  | LabelElement
  | CallElement<Vars, AnyScriptLibrary>
  | ReturnElement<Vars, Return>;

export type ScriptNode<Vars, Input, Return, Yield> =
  | SociablyEmpty
  | ContentNode<Vars>
  | ScriptElement<Vars, Input, Return, Yield>
  | ScriptNode<Vars, Input, Return, Yield>[]
  | SociablyElement<
      { children: ScriptNode<Vars, Input, Return, Yield> },
      typeof Sociably.Fragment
    >;

export type ConditionsSegment<Vars> = {
  type: 'conditions';
  branches: {
    condition: ConditionMatcher<Vars>;
    body: ScriptSegment<Vars, unknown, unknown, unknown>[];
  }[];
  fallbackBody: null | ScriptSegment<Vars, unknown, unknown, unknown>[];
};

export type WhileSegment<Vars> = {
  type: 'while';
  condition: ConditionMatcher<Vars>;
  body: ScriptSegment<Vars, unknown, unknown, unknown>[];
};

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
  setVars?: PromptSetter<Vars, Input>;
};

export type CallCommand<Vars, Params, Return, Yield> = {
  type: 'call';
  key: string;
  script: ScriptLibrary<unknown, unknown, Params, Return, Yield>;
  withParams?: CallParamsGetter<Vars, Params>;
  setVars?: CallReturnSetter<Vars, Return>;
  goto?: string;
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

export type EffectCommand<Vars, Yield> = {
  type: 'effect';
  setVars?: EffectSetter<Vars>;
  yieldValue?: EffectYielder<Vars, Yield>;
};

export type ReturnCommand<Vars, Return> = {
  type: 'return';
  getValue?: ReturnValueGetter<Vars, Return>;
};

export type ScriptSegment<Vars, Input, Return, Yield> =
  | ContentCommand<Vars>
  | ConditionsSegment<Vars>
  | WhileSegment<Vars>
  | PromptCommand<Vars, Input>
  | CallCommand<Vars, unknown, unknown, Yield>
  | EffectCommand<Vars, Yield>
  | LabelSegment
  | ReturnCommand<Vars, Return>;

export type ScriptCommand<Vars, Input, Return, Yield> =
  | ContentCommand<Vars>
  | JumpCommand
  | JumpCondCommand<Vars>
  | PromptCommand<Vars, Input>
  | CallCommand<Vars, unknown, unknown, Yield>
  | EffectCommand<Vars, Yield>
  | ReturnCommand<Vars, Return>;

export type CallStatus<Vars> = {
  script: ScriptLibrary<Vars, unknown, unknown, unknown, unknown>;
  vars: Vars;
  stopAt: undefined | string;
};

export type SerializedCallStatus<Vars> = {
  name: string;
  vars: Vars;
  stopAt: string;
};

export type ScriptProcessState = {
  version: '0';
  timestamp: number;
  callStack: SerializedCallStatus<unknown>[];
};

export type ParamsOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<unknown, unknown, infer Params, unknown, unknown>
    ? Params
    : never;

export type VarsOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<infer Vars, unknown, unknown, unknown, unknown>
    ? Vars
    : never;

export type InputOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<unknown, infer Input, unknown, unknown, unknown>
    ? Input
    : never;

export type ReturnOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<unknown, unknown, unknown, infer Return, unknown>
    ? Return
    : never;

export type YieldOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<unknown, unknown, unknown, unknown, infer Yield>
    ? Yield
    : never;
