import Sociably, {
  SociablyNode,
  SociablyEmpty,
  SociablyElement,
  SociablyThread,
  ContainerComponent,
} from '@sociably/core';

import type { MaybeContainer } from '@sociably/core/service';

import { SOCIABLY_SCRIPT_TYPE } from './constant.js';
import type {
  IF,
  ELSE,
  ELSE_IF,
  WHILE,
  PROMPT,
  LABEL,
  CALL,
  EFFECT,
  RETURN,
} from './keyword.js';

type StartScriptProps<Params> = {
  params?: Params;
  goto?: string;
};

export type ScriptLibrary<Vars, Input, Params, Return, Yield, Meta> = {
  $$typeof: typeof SOCIABLY_SCRIPT_TYPE;
  Start: ContainerComponent<StartScriptProps<Params>>;
  commands: ScriptCommand<Vars, Input, Return, Yield, Meta>[];
  initVars: (params: Params) => Vars;
  name: string;
  stopPointIndex: Map<string, number>;
  meta: Meta;
};

export type AnyScriptLibrary = ScriptLibrary<any, any, any, any, any, any>;

export type ScriptCircs<Vars, Meta> = {
  platform: string;
  thread: SociablyThread;
  vars: Vars;
  meta: Meta;
};

export type ContentFn<Vars, Meta> = (
  circs: ScriptCircs<Vars, Meta>
) => SociablyNode | Promise<SociablyNode>;

export type ContentNode<Vars, Meta> = MaybeContainer<ContentFn<Vars, Meta>>;

export type ConditionMatchFn<Vars, Meta> = (
  circs: ScriptCircs<Vars, Meta>
) => boolean | Promise<boolean>;

export type ConditionMatcher<Vars, Meta> = MaybeContainer<
  ConditionMatchFn<Vars, Meta>
>;

/**
 * @category Keyword Props
 */
export type IfProps<Vars, Input, Return, Yield, Meta> = {
  condition: ConditionMatcher<Vars, Meta>;
  children: ScriptNode<Vars, Input, Return, Yield, Meta>;
};

/**
 * @category Keyword Element
 */
export type IfElement<Vars, Input, Return, Yield, Meta> = SociablyElement<
  IfProps<Vars, Input, Return, Yield, Meta>,
  typeof IF
>;

/**
 * @category Keyword Props
 */
export type BlockProps<Vars, Input, Return, Yield, Meta> = {
  children: ScriptNode<Vars, Input, Return, Yield, Meta>;
};

/**
 * @category Keyword Element
 */
export type ElseElement<Vars, Input, Return, Yield, Meta> = SociablyElement<
  BlockProps<Vars, Input, Return, Yield, Meta>,
  typeof ELSE
>;

/**
 * @category Keyword Element
 */
export type ElseIfElement<Vars, Input, Return, Yield, Meta> = SociablyElement<
  IfProps<Vars, Input, Return, Yield, Meta>,
  typeof ELSE_IF
>;

/**
 * @category Keyword Props
 */
export type WhileProps<Vars, Input, Return, Yield, Meta> = {
  condition: ConditionMatcher<Vars, Meta>;
  children: ScriptNode<Vars, Input, Return, Yield, Meta>;
};

/**
 * @category Keyword Element
 */
export type WhileElement<Vars, Input, Return, Yield, Meta> = SociablyElement<
  WhileProps<Vars, Input, Return, Yield, Meta>,
  typeof WHILE
>;

export type PromptSetFn<Vars, Input, Meta> = (
  circs: ScriptCircs<Vars, Meta>,
  input: Input
) => Vars | Promise<Vars>;

export type PromptSetter<Vars, Input, Meta> = MaybeContainer<
  PromptSetFn<Vars, Input, Meta>
>;

/**
 * @category Keyword Props
 */
export type PromptProps<Vars, Input, Meta> = {
  key: string;
  set?: PromptSetter<Vars, Input, Meta>;
};

/**
 * @category Keyword Element
 */
export type PromptElement<Vars, Input, Meta> = SociablyElement<
  PromptProps<Vars, Input, Meta>,
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

export type CallParamsFn<Vars, Params, Meta> = (
  circs: ScriptCircs<Vars, Meta>
) => Params | Promise<Params>;

export type CallParamsGetter<Vars, Params, Meta> = MaybeContainer<
  CallParamsFn<Vars, Params, Meta>
>;

export type CallReturnSetFn<Vars, Return, Meta> = (
  circs: ScriptCircs<Vars, Meta>,
  returnValue: Return
) => Vars | Promise<Vars>;

export type CallReturnSetter<Vars, Return, Meta> = MaybeContainer<
  CallReturnSetFn<Vars, Return, Meta>
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
  unknown,
  infer Meta
>
  ? {
      script: Script;
      key: string;
      params?: CallParamsGetter<Vars, Params, Meta>;
      set?: CallReturnSetter<Vars, Return, Meta>;
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

export type EffectSetFn<Vars, Meta> = (
  circs: ScriptCircs<Vars, Meta>
) => Vars | Promise<Vars>;

export type EffectSetter<Vars, Meta> = MaybeContainer<EffectSetFn<Vars, Meta>>;

export type EffectYieldFn<Vars, Yield, Meta> = (
  circs: ScriptCircs<Vars, Meta>,
  prevValue: undefined | Yield
) => Yield | Promise<Yield>;

export type EffectYielder<Vars, Yield, Meta> = MaybeContainer<
  EffectYieldFn<Vars, Yield, Meta>
>;

/**
 * @category Keyword Props
 */
export type EffectProps<Vars, Yield, Meta> = {
  set?: EffectSetter<Vars, Meta>;
  yield?: EffectYielder<Vars, Yield, Meta>;
};

/**
 * @category Keyword Element
 */
export type EffectElement<Vars, Yield, Meta> = SociablyElement<
  EffectProps<Vars, Yield, Meta>,
  typeof EFFECT
>;

export type ReturnValueFn<Vars, Return, Meta> = (
  circs: ScriptCircs<Vars, Meta>
) => Return | Promise<Return>;

export type ReturnValueGetter<Vars, Return, Meta> = MaybeContainer<
  ReturnValueFn<Vars, Return, Meta>
>;

/**
 * @category Keyword Props
 */
export type ReturnProps<Vars, Return, Meta> = {
  value?: ReturnValueGetter<Vars, Return, Meta>;
};

/**
 * @category Keyword Element
 */
export type ReturnElement<Vars, Return, Meta> = SociablyElement<
  ReturnProps<Vars, Return, Meta>,
  typeof RETURN
>;

export type ScriptElement<Vars, Input, Return, Yield, Meta> =
  | IfElement<Vars, Input, Return, Yield, Meta>
  | WhileElement<Vars, Input, Return, Yield, Meta>
  | PromptElement<Vars, Input, Meta>
  | LabelElement
  | CallElement<Vars, AnyScriptLibrary>
  | ReturnElement<Vars, Return, Meta>;

export type ScriptNode<Vars, Input, Return, Yield, Meta> =
  | SociablyEmpty
  | ContentNode<Vars, Meta>
  | ScriptElement<Vars, Input, Return, Yield, Meta>
  | ScriptNode<Vars, Input, Return, Yield, Meta>[]
  | SociablyElement<
      { children: ScriptNode<Vars, Input, Return, Yield, Meta> },
      typeof Sociably.Fragment
    >;

export type ConditionsSegment<Vars, Meta> = {
  type: 'conditions';
  branches: {
    condition: ConditionMatcher<Vars, Meta>;
    body: ScriptSegment<Vars, unknown, unknown, unknown, Meta>[];
  }[];
  fallbackBody: null | ScriptSegment<Vars, unknown, unknown, unknown, Meta>[];
};

export type WhileSegment<Vars, Meta> = {
  type: 'while';
  condition: ConditionMatcher<Vars, Meta>;
  body: ScriptSegment<Vars, unknown, unknown, unknown, Meta>[];
};

export type LabelSegment = {
  type: 'label';
  key: string;
};

export type ContentCommand<Vars, Meta> = {
  type: 'content';
  getContent: ContentNode<Vars, Meta>;
};

export type PromptCommand<Vars, Input, Meta> = {
  type: 'prompt';
  key: string;
  setVars?: PromptSetter<Vars, Input, Meta>;
};

export type CallCommand<Vars, Params, Return, Yield, Meta> = {
  type: 'call';
  key: string;
  script: ScriptLibrary<unknown, unknown, Params, Return, Yield, Meta>;
  withParams?: CallParamsGetter<Vars, Params, Meta>;
  setVars?: CallReturnSetter<Vars, Return, Meta>;
  goto?: string;
};

export type JumpCommand = {
  type: 'jump';
  offset: number;
};

export type JumpCondCommand<Vars, Meta> = {
  type: 'jump_cond';
  offset: number;
  condition: ConditionMatcher<Vars, Meta>;
  isNot: boolean;
};

export type EffectCommand<Vars, Yield, Meta> = {
  type: 'effect';
  setVars?: EffectSetter<Vars, Meta>;
  yieldValue?: EffectYielder<Vars, Yield, Meta>;
};

export type ReturnCommand<Vars, Return, Meta> = {
  type: 'return';
  getValue?: ReturnValueGetter<Vars, Return, Meta>;
};

export type ScriptSegment<Vars, Input, Return, Yield, Meta> =
  | ContentCommand<Vars, Meta>
  | ConditionsSegment<Vars, Meta>
  | WhileSegment<Vars, Meta>
  | PromptCommand<Vars, Input, Meta>
  | CallCommand<Vars, unknown, unknown, Yield, Meta>
  | EffectCommand<Vars, Yield, Meta>
  | LabelSegment
  | ReturnCommand<Vars, Return, Meta>;

export type ScriptCommand<Vars, Input, Return, Yield, Meta> =
  | ContentCommand<Vars, Meta>
  | JumpCommand
  | JumpCondCommand<Vars, Meta>
  | PromptCommand<Vars, Input, Meta>
  | CallCommand<Vars, unknown, unknown, Yield, Meta>
  | EffectCommand<Vars, Yield, Meta>
  | ReturnCommand<Vars, Return, Meta>;

export type CallStatus<Vars> = {
  script: ScriptLibrary<Vars, unknown, unknown, unknown, unknown, unknown>;
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
  Script extends ScriptLibrary<
    unknown,
    unknown,
    infer Params,
    unknown,
    unknown,
    unknown
  >
    ? Params
    : never;

export type VarsOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<
    infer Vars,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown
  >
    ? Vars
    : never;

export type InputOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<
    unknown,
    infer Input,
    unknown,
    unknown,
    unknown,
    unknown
  >
    ? Input
    : never;

export type ReturnOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<
    unknown,
    unknown,
    unknown,
    infer Return,
    unknown,
    unknown
  >
    ? Return
    : never;

export type YieldOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<
    unknown,
    unknown,
    unknown,
    unknown,
    infer Yield,
    unknown
  >
    ? Yield
    : never;

export type MetaOfScript<Script extends AnyScriptLibrary> =
  Script extends ScriptLibrary<
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    infer Meta
  >
    ? Meta
    : never;
