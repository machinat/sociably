import type { MachinatApp } from '@machinat/core';
import { ServiceScope } from '@machinat/core/service';
import Subject from './subject';

export type StreamFrame<T> = {
  key: undefined | string;
  scope: ServiceScope;
  value: T;
};

export type OperatorFunction<T, R> = (input: Subject<T>) => Subject<R>;

export type EventContextOfApp<
  App extends MachinatApp<any, any>
> = App extends MachinatApp<any, infer Context> ? Context : never;
