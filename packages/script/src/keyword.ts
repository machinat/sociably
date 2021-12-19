import Machinat from '@machinat/core';
import type {
  IfProps,
  BlockProps,
  ElseIfProps,
  WhileProps,
  PromptProps,
  LabelProps,
  CallProps,
  EffectProps,
  ReturnProps,
  AnyScriptLibrary,
} from './types';

// HACK: enable typing of a Fragment block
/**
 * @category Keyword
 */
export const $ = Machinat.Fragment as unknown as <
  Vars = any,
  Input = any,
  Return = any,
  Yield = any
>(
  props: BlockProps<Vars, Input, Return, Yield>
) => null;

/**
 * @category Keyword
 */
export const IF = <Vars = any, Input = any, Return = any, Yield = any>(
  props: IfProps<Vars, Input, Return, Yield>
): null => null;

/**
 * @category Keyword
 */
export const THEN = <Vars = any, Input = any, Return = any, Yield = any>(
  props: BlockProps<Vars, Input, Return, Yield>
): null => null;

/**
 * @category Keyword
 */
export const ELSE_IF = <Vars = any, Input = any, Return = any, Yield = any>(
  props: ElseIfProps<Vars, Input, Return, Yield>
): null => null;

/**
 * @category Keyword
 */
export const ELSE = <Vars = any, Input = any, Return = any, Yield = any>(
  props: BlockProps<Vars, Input, Return, Yield>
): null => null;

/**
 * @category Keyword
 */
export const WHILE = <Vars = any, Input = any, Return = any, Yield = any>(
  props: WhileProps<Vars, Input, Return, Yield>
): null => null;

/**
 * @category Keyword
 */
export const PROMPT = <Vars = any, Input = any, Yield = any>(
  props: PromptProps<Vars, Input, Yield>
): null => null;

/**
 * @category Keyword
 */
export const LABEL = (props: LabelProps): null => null;

/**
 * @category Keyword
 */
export const CALL = <Vars = any, Script extends AnyScriptLibrary = any>(
  props: CallProps<Vars, Script>
): null => null;

/**
 * @category Keyword
 */
export const EFFECT = <Vars = any, Result = any>(
  props: EffectProps<Vars, Result>
): null => null;

/**
 * @category Keyword
 */
export const RETURN = <Vars = any, Return = any>(
  props: ReturnProps<Vars, Return>
): null => null;
