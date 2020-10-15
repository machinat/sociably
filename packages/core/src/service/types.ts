import {
  MACHINAT_SERVICE_CONTAINER,
  MACHINAT_SERVICE_PROVIDER,
  MACHINAT_SERVICE_INTERFACE,
} from '../symbol';

export { default as ServiceScope } from './scope';

export type ServiceLifetime = 'singleton' | 'scoped' | 'transient';

export interface SingularServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: false;
  $$branched: false;
}

export interface MultiServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: true;
  $$branched: false;
}

export interface BranchedServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: false;
  $$branched: true;
}

export type ServiceInterface<T> =
  | SingularServiceInterface<T>
  | MultiServiceInterface<T>
  | BranchedServiceInterface<T>;

export interface ServiceProvider<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_PROVIDER;
  $$multi: false;
  $$branched: false;
  $$lifetime: ServiceLifetime;
  $$deps: ServiceRequirement<T>[];
  $$factory: (...args: any[]) => T;
}

export type Interfaceable<T> = ServiceInterface<T> | ServiceProvider<T>;

export type ServiceRequirement<T> = {
  require: Interfaceable<T>;
  optional?: boolean;
};

export type ServiceDependency<T> = ServiceRequirement<T> | Interfaceable<T>;

export type ServiceContainer<T> = {
  (...args: unknown[]): T;
  $$typeof: typeof MACHINAT_SERVICE_CONTAINER;
  $$deps: ServiceRequirement<T>[];
  // HACK: make ts compiler accept it as class component
  new (): ServiceContainer<T>;
};

export type MaybeContainerOf<T> = T | ServiceContainer<T>;

export type BranchedProviderBinding<T> = {
  provide: BranchedServiceInterface<T>;
  withProvider: ServiceProvider<T>;
  platform: string;
};

export type ProviderBinding<T> =
  | {
      provide:
        | SingularServiceInterface<T>
        | MultiServiceInterface<T>
        | ServiceProvider<T>;
      withProvider: ServiceProvider<T>;
    }
  | BranchedProviderBinding<T>;

export type BranchedValueBinding<T> = {
  provide: BranchedServiceInterface<T>;
  withValue: T;
  platform: string;
};

export type ValueBinding<T> =
  | {
      provide:
        | SingularServiceInterface<T>
        | MultiServiceInterface<T>
        | ServiceProvider<T>;
      withValue: T;
    }
  | BranchedValueBinding<T>;

export type ServiceBinding<T> = ProviderBinding<T> | ValueBinding<T>;

export type ServiceProvision<T> = ServiceBinding<T> | ServiceProvider<T>;

export type ServiceCache = Map<ServiceProvider<unknown>, unknown>;

export type ResolveDependencies<
  Deps extends ReadonlyArray<ServiceDependency<any>>
> = {
  [Idx in keyof Deps]: Deps[Idx] extends Interfaceable<infer T>
    ? T
    : Deps[Idx] extends { require: Interfaceable<infer T>; optional?: false }
    ? T
    : Deps[Idx] extends { require: Interfaceable<infer T>; optional: true }
    ? null | T
    : never;
};
