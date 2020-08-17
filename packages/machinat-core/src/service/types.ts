import {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_INTERFACE,
} from '../symbol';

export { default as ServiceScope } from './scope';

export type ServiceLifetime = 'singleton' | 'scoped' | 'transient';

export interface ServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICES_INTERFACE;
  $$multi: boolean;
}

export interface ServiceProvider<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICES_PROVIDER;
  $$multi: false;
  $$lifetime: ServiceLifetime;
  $$deps: ServiceRequirement<T>[];
  $$factory: (...args: any[]) => T;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type ClassType<T> = Function & { prototype: T };

export type Interfaceable<T> = ServiceInterface<T> | ServiceProvider<T>;

export type ServiceRequirement<T> = {
  require: Interfaceable<T> | ClassType<T>;
  optional: boolean;
};

export type ServiceDependency<T> =
  | ServiceRequirement<T>
  | Interfaceable<T>
  | ClassType<T>;

export interface ServiceContainer<T> {
  (...args: any[]): T;
  $$typeof: typeof MACHINAT_SERVICES_CONTAINER;
  $$deps: ServiceRequirement<T>[];
}

export type ProviderBinding<T> = {
  provide: Interfaceable<T> | ClassType<T>;
  withProvider: ServiceProvider<T> | ClassType<T>;
  platforms?: string[];
};

export type ValueBinding<T> = {
  provide: Interfaceable<T> | ClassType<T>;
  withValue: T;
  platforms?: string[];
};

export type ServiceBinding<T> = ProviderBinding<T> | ValueBinding<T>;

export type AppProvision<T> =
  | ServiceBinding<T>
  | ServiceProvider<T>
  | ClassType<T>;

export type ServiceCache<T> = Map<ServiceProvider<T>, T>;
