// @flow
/* eslint-disable class-methods-use-this, no-unused-vars, import/prefer-default-export */
import { abstractInterface } from '@machinat/core/service';

class AbstractRepository {
  get<T>(name: string, key: string): Promise<void | T> {
    throw new TypeError('method called on abstract class');
  }

  set<T>(name: string, key: string, state: T): Promise<boolean> {
    throw new TypeError('method called on abstract class');
  }

  delete(name: string, key: string): Promise<boolean> {
    throw new TypeError('method called on abstract class');
  }

  getAll(name: string): Promise<null | Map<string, any>> {
    throw new TypeError('method called on abstract class');
  }

  clear(name: string): Promise<void> {
    throw new TypeError('method called on abstract class');
  }
}

export const StateRepositoryI = abstractInterface<AbstractRepository>()(
  AbstractRepository
);
