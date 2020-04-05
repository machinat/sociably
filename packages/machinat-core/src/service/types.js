// @flow
import typeof {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_INTERFACE,
} from '../symbol';

export type { default as ServiceScope } from './scope'; // eslint-disable-line import/prefer-default-export

export type ServiceLifetime = 'singleton' | 'scoped' | 'transient';

export type ServiceInterface<_T, K> = K & {
  $$name: string,
  $$typeof: MACHINAT_SERVICES_INTERFACE,
  $$multi: boolean,
};

export type ServiceProvider<T, K> = K & {
  $$name: string,
  $$typeof: MACHINAT_SERVICES_PROVIDER,
  $$lifetime: ServiceLifetime,
  $$deps: InjectRequirement[], // eslint-disable-line no-use-before-define
  $$factory: (...args: any[]) => T,
};

export type Interfaceable =
  | ServiceInterface<any, any>
  | ServiceProvider<any, any>;

export type InjectRequirement = {|
  require: Interfaceable,
  optional: boolean,
|};

export interface ServiceContainer<T> {
  (...args: any[]): T;
  $$typeof: MACHINAT_SERVICES_CONTAINER;
  $$deps: InjectRequirement[];
}

export type ProviderBinding = {|
  provide: Interfaceable,
  withProvider: ServiceProvider<any, any>,
  platforms?: string[],
|};

export type ValueBinding = {|
  provide: Interfaceable,
  withValue: any,
  platforms?: string[],
|};

export type ProvisionBinding = ProviderBinding | ValueBinding;

export type ServiceCache = Map<ServiceProvider<any, any>, any>;
