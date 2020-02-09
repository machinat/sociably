// @flow
export const PHASE_ENUM_INITIATION: 1 = 1;
export const PHASE_ENUM_BEGIN_SCOPE: 2 = 2;
export const PHASE_ENUM_INJECTION: 3 = 3;
export type PhaseEnum =
  | typeof PHASE_ENUM_INITIATION
  | typeof PHASE_ENUM_BEGIN_SCOPE
  | typeof PHASE_ENUM_INJECTION;
