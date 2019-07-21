// @flow
import type { ServiceProvideFn } from './types';

const context = <T>(defaultValue: T): ServiceProvideFn<T, T, void> => (
  providedValue?: T
) => async () => (providedValue === undefined ? defaultValue : providedValue);

export default context;
