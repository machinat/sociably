import type {
  IfProps,
  BlockProps,
  ElseIfProps,
  WhileProps,
  PromptProps,
  VarsProps,
  LabelProps,
  CallProps,
  ReturnProps,
} from './types';

/**
 * @category Keyword
 */
export const IF = <Vars, Input = null, Return = void>(
  props: IfProps<Vars, Input, Return>
): null => null;
/**
 * @category Keyword
 */
export const THEN = <Vars, Input = null, Return = void>(
  props: BlockProps<Vars, Input, Return>
): null => null;

/**
 * @category Keyword
 */
export const ELSE_IF = <Vars, Input = null, Return = void>(
  props: ElseIfProps<Vars, Input, Return>
): null => null;

/**
 * @category Keyword
 */
export const ELSE = <Vars, Input = null, Return = void>(
  props: BlockProps<Vars, Input, Return>
): null => null;

/**
 * @category Keyword
 */
export const WHILE = <Vars, Input = null, Return = void>(
  props: WhileProps<Vars, Input, Return>
): null => null;

/**
 * @category Keyword
 */
export const PROMPT = <Vars, Input = null>(
  props: PromptProps<Vars, Input>
): null => null;

/**
 * @category Keyword
 */
export const VARS = <Vars>(props: VarsProps<Vars>): null => null;

/**
 * @category Keyword
 */
export const LABEL = (props: LabelProps): null => null;

/**
 * @category Keyword
 */
export const CALL = <Vars, Input = null, Return = void>(
  props: CallProps<Vars, Input, Return>
): null => null;

/**
 * @category Keyword
 */
export const RETURN = <Vars, Return = void>(
  props: ReturnProps<Vars, Return>
): null => null;

// TODO: more keywords
// const SWITCH = Symbol('switch.keyword.script.machinat');
// const CASE = Symbol('case.keyword.script.machinat');
// const DEFAULT = Symbol('defaut.keyword.script.machinat');
//
// const BREAK = Symbol('break.keyword.script.machinat');
// const CONTINUE = Symbol('continue.keyword.script.machinat');
