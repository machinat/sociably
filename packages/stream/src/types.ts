import type { SociablyApp } from '@sociably/core';
import { ServiceScope } from '@sociably/core/service';
import Stream from './stream.js';

export type StreamingFrame<T> = {
  key: undefined | string;
  scope: ServiceScope;
  value: T;
};

export type OperatorFunction<T, R> = (input: Stream<T>) => Stream<R>;

export type EventContextOfApp<App extends SociablyApp<any, any>> =
  App extends SociablyApp<any, infer Context> ? Context : never;
