import {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_INTERFACE,
} from '../symbol';

export { default as ServiceScope } from './scope';

export type ServiceLifetime = 'singleton' | 'scoped' | 'transient';

export type ServiceInterface<_T, K> = K & {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICES_INTERFACE;
  $$multi: boolean;
};

export type ServiceProvider<T, K> = K & {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICES_PROVIDER;
  $$lifetime: ServiceLifetime;
  $$deps: InjectRequirement[]; // eslint-disable-line no-use-before-define
  $$factory: (...args: any[]) => T;
  $$multi: false;
};

export type Interfaceable = {
  $$name: string;
  $$multi: boolean;
  $$typeof:
    | typeof MACHINAT_SERVICES_INTERFACE
    | typeof MACHINAT_SERVICES_PROVIDER;
};

export type InjectRequirement = {
  require: Interfaceable;
  optional: boolean;
};

export interface ServiceContainer<T> {
  (...args: any[]): T;
  $$typeof: typeof MACHINAT_SERVICES_CONTAINER;
  $$deps: InjectRequirement[];
}

export type ProviderBinding = {
  provide: Interfaceable;
  withProvider: ServiceProvider<any, any>;
  platforms?: string[];
};

export type ValueBinding = {
  provide: Interfaceable;
  withValue: any;
  platforms?: string[];
};

export type ProvisionBinding = ProviderBinding | ValueBinding;

export type ServiceProvidable = ServiceProvider<any, any> | ProvisionBinding;

export type ServiceCache = Map<ServiceProvider<any, any>, any>;
