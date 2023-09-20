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
  GotoProps,
  AnyScriptLibrary,
} from './types.js';

// HACK: an alia of Fragment with script types
/** @category Keyword */
export const BLOCK = Sociably.Fragment as unknown as <
  Vars = any,
  Input = any,
  Return = any,
  Yield = any,
  Meta = any,
>(
  _props: BlockProps<Vars, Input, Return, Yield, Meta>,
) => null;

/** @category Keyword */
export const IF = <
  Vars = any,
  Input = any,
  Return = any,
  Yield = any,
  Meta = any,
>(
  _props: IfProps<Vars, Input, Return, Yield, Meta>,
): null => null;

/** @category Keyword */
export const ELSE_IF = <
  Vars = any,
  Input = any,
  Return = any,
  Yield = any,
  Meta = any,
>(
  _props: IfProps<Vars, Input, Return, Yield, Meta>,
): null => null;

/** @category Keyword */
export const ELSE = <
  Vars = any,
  Input = any,
  Return = any,
  Yield = any,
  Meta = any,
>(
  _props: BlockProps<Vars, Input, Return, Yield, Meta>,
): null => null;

/** @category Keyword */
export const WHILE = <
  Vars = any,
  Input = any,
  Return = any,
  Yield = any,
  Meta = any,
>(
  _props: WhileProps<Vars, Input, Return, Yield, Meta>,
): null => null;

/** @category Keyword */
export const PROMPT = <Vars = any, Input = any, Meta = any>(
  _props: PromptProps<Vars, Input, Meta>,
): null => null;

/** @category Keyword */
export const LABEL = (_props: LabelProps): null => null;

/** @category Keyword */
export const CALL = <Vars = any, Script extends AnyScriptLibrary = any>(
  _props: CallProps<Vars, Script>,
): null => null;

/** @category Keyword */
export const EFFECT = <Vars = any, Yield = any, Meta = any>(
  _props: EffectProps<Vars, Yield, Meta>,
): null => null;

/** @category Keyword */
export const RETURN = <Vars = any, Return = any, Meta = any>(
  _props: ReturnProps<Vars, Return, Meta>,
): null => null;

/** @category Keyword */
export const GOTO = (_props: GotoProps): null => null;
