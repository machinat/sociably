export type TraverseElementCallback = (MachinatRenderable, string, any) => void;

export type ElementReducer = <Reduced>(
  Reduced,
  MachinatRenderable,
  string,
  any
) => Reduced;

export type ReduceContext<Reduced> = {
  reduced: Reduced,
  reducer: Reducer,
  payload: any,
};
