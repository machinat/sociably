/* eslint-disable import/prefer-default-export */
import { abstractInterface } from '@machinat/core/service';

@abstractInterface<StateRepositoryI>({
  name: 'StateRepository',
})
export abstract class StateRepositoryI {
  abstract get<T>(name: string, key: string): Promise<void | T>;
  abstract set<T>(name: string, key: string, state: T): Promise<boolean>;
  abstract delete(name: string, key: string): Promise<boolean>;
  abstract getAll(name: string): Promise<null | Map<string, any>>;
  abstract clear(name: string): Promise<void>;
}
