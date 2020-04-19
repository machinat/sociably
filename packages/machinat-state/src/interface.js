// @flow
/* eslint-disable class-methods-use-this, no-unused-vars, import/prefer-default-export */
import { abstractInterface } from '@machinat/core/service';

class AbstractRepository {
  +get: <T>(name: string, key: string) => Promise<void | T>;

  +set: <T>(name: string, key: string, state: T) => Promise<boolean>;

  +delete: (name: string, key: string) => Promise<boolean>;

  +getAll: (name: string) => Promise<null | Map<string, any>>;

  +clear: (name: string) => Promise<void>;
}

export const StateRepositoryI = abstractInterface<AbstractRepository>()(
  AbstractRepository
);
