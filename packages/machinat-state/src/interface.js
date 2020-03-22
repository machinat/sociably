// @flow
/* eslint-disable class-methods-use-this, no-unused-vars, import/prefer-default-export */
import { abstractInterface } from '@machinat/core/service';

const abstractError = new Error('call on the method of an abstract class');

class AbstractRepository {
  get<T>(name: string, key: string): Promise<null | T> {
    throw abstractError;
  }

  set<T>(name: string, key: string, state: T): Promise<boolean> {
    throw abstractError;
  }

  delete(name: string, key: string): Promise<boolean> {
    throw abstractError;
  }

  getAll(name: string): Promise<null | Map<string, any>> {
    throw abstractError;
  }

  clear(name: string): Promise<void> {
    throw abstractError;
  }
}

export const StateRepositoryI = abstractInterface<AbstractRepository>()(
  AbstractRepository
);
