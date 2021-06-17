import type { MachinatApp } from '@machinat/core';
import { ServiceScope } from '@machinat/core/service';
import Stream from './stream';

export type StreamingFrame<T> = {
  key: undefined | string;
  scope: ServiceScope;
  value: T;
};

export type OperatorFunction<T, R> = (input: Stream<T>) => Stream<R>;

export type EventContextOfApp<App extends MachinatApp<any, any>> =
  App extends MachinatApp<any, infer Context> ? Context : never;
