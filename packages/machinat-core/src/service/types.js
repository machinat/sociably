// @flow
import typeof {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_ABSTRACTION,
  MACHINAT_SERVICES_INTERFACEABLE,
} from '../symbol';

export type { default as InjectionScope } from './scope'; // eslint-disable-line import/prefer-default-export

export type ServeStrategy = 'singleton' | 'scoped' | 'transient';

export type AbstractProvider<T> = T & {|
  $$typeof: MACHINAT_SERVICES_ABSTRACTION,
|};

export type NamedInterfaceable = {|
  $$typeof: MACHINAT_SERVICES_INTERFACEABLE,
  name: string,
|};

export type ServiceProvider<T> = T & {|
  name: string,
  $$typeof: MACHINAT_SERVICES_PROVIDER,
  $$strategy: ServeStrategy,
  $$deps: InjectRequirement[], // eslint-disable-line no-use-before-define
  $$factory: (...args: any[]) => T,
|};

export type Interfaceable =
  | NamedInterfaceable
  | AbstractProvider<any>
  | ServiceProvider<any>;

export type InjectRequirement = {|
  require: Interfaceable,
  optional: boolean,
|};

export interface ServiceContainer<T> {
  (...args: any[]): T;
  $$typeof: MACHINAT_SERVICES_CONTAINER;
  $$deps: InjectRequirement[];
}

type ProviderBinding = {|
  provide: Interfaceable,
  withProvider: ServiceProvider<any>,
  platforms?: string[],
|};

type ValueBinding = {|
  provide: Interfaceable,
  withValue: any,
  platforms?: string[],
|};

export type ProvisionBinding = ProviderBinding | ValueBinding;

export type ServiceCache<T> = Map<ServiceProvider<T>, T>;
