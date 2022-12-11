import Sociably from '@sociably/core';
import type {
  IfProps,
  BlockProps,
  WhileProps,
  PromptProps,
  LabelProps,
  CallProps,
  EffectProps,
  ReturnProps,
  AnyScriptLibrary,
} from './types';

// HACK: an alia of Fragment with script types
/**
 * @category Keyword
 */
export const BLOCK = Sociably.Fragment as unknown as <
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
export const ELSE_IF = <Vars = any, Input = any, Return = any, Yield = any>(
  props: IfProps<Vars, Input, Return, Yield>
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
export const PROMPT = <Vars = any, Input = any>(
  props: PromptProps<Vars, Input>
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
export const EFFECT = <Vars = any, Yield = any>(
  props: EffectProps<Vars, Yield>
): null => null;

/**
 * @category Keyword
 */
export const RETURN = <Vars = any, Return = any>(
  props: ReturnProps<Vars, Return>
): null => null;
