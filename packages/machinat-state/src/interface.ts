import { abstractInterface } from '@machinat/core/service';

export abstract class StateRepository {
  abstract get<T>(name: string, key: string): Promise<void | T>;
  abstract set<T>(name: string, key: string, state: T): Promise<boolean>;
  abstract delete(name: string, key: string): Promise<boolean>;
  abstract getAll(name: string): Promise<null | Map<string, any>>;
  abstract clear(name: string): Promise<void>;
}

export const StateRepositoryI = abstractInterface<StateRepository>({
  name: 'StateRepositoryI',
})(StateRepository);
