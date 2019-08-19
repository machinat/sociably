// @flow
const IF = Symbol('machinat.script.keyword.if');
const THEN = Symbol('machinat.script.keyword.then');
const ELSE_IF = Symbol('machinat.script.keyword.else_if');
const ELSE = Symbol('machinat.script.keyword.else');

const FOR = Symbol('machinat.script.keyword.for');

const WHILE = Symbol('machinat.script.keyword.while');

const PROMPT = Symbol('machinat.script.keyword.prompt');

const VARS = Symbol('machinat.script.keyword.vars');

const LABEL = Symbol('machinat.script.keyword.label');

// TODO: unsupported keywords
/* eslint-disable no-unused-vars */
const SWITCH = Symbol('machinat.script.keyword.if');
const CASE = Symbol('machinat.script.keyword.case');
const DEFAULT = Symbol('machinat.script.keyword.defaut');

const BREAK = Symbol('machinat.script.keyword.break');
const CONTINUE = Symbol('machinat.script.keyword.continue');
/* eslint-enable no-unused-vars */

export {
  IF as If,
  THEN as Then,
  ELSE as Else,
  ELSE_IF as ElseIf,
  FOR as For,
  WHILE as While,
  PROMPT as Prompt,
  VARS as Vars,
  LABEL as Label,
};
