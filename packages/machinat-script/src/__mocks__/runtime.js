import moxy from 'moxy';

export const initRuntime = moxy(() => ({
  finished: true,
  stack: undefined,
  constent: ['hello world'],
}));

export const continueRuntime = moxy(() => ({
  finished: true,
  stack: undefined,
  constent: ['bye world'],
}));
