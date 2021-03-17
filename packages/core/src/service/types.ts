import {
  MACHINAT_SERVICE_CONTAINER,
  MACHINAT_SERVICE_PROVIDER,
  MACHINAT_SERVICE_INTERFACE,
} from '../symbol';
import ServiceScope from './scope';

export { default as ServiceScope } from './scope';

export type ServiceLifetime = 'singleton' | 'scoped' | 'transient';

export interface SingularServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: false;
  $$polymorphic: false;
}

export interface MultiServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: true;
  $$polymorphic: false;
}

export interface PolymorphicServiceInterface<T> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_INTERFACE;
  $$multi: false;
  $$polymorphic: true;
}

export type ServiceInterface<T> =
  | SingularServiceInterface<T>
  | MultiServiceInterface<T>
  | PolymorphicServiceInterface<T>;

export interface ServiceProvider<T, Args extends ReadonlyArray<unknown>> {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_PROVIDER;
  $$multi: false;
  $$polymorphic: false;
  $$lifetime: ServiceLifetime;
  $$deps: ServiceRequirement<Interfaceable<Args[number]>>[];
  $$factory(...args: Args): T;
}

export type Interfaceable<T> =
  | ServiceInterface<T>
  | ServiceProvider<T, unknown[]>;

type OptionalServiceRequirement<I extends Interfaceable<unknown>> = {
  require: I;
  optional: true;
};

type StrictServiceRequirement<I extends Interfaceable<unknown>> = {
  require: I;
  optional?: false;
};

export type ServiceRequirement<T extends Interfaceable<unknown>> =
  | OptionalServiceRequirement<T>
  | StrictServiceRequirement<T>;

export type ServiceDependency<I extends Interfaceable<unknown>> =
  | I
  | ServiceRequirement<I>
  | typeof ServiceScope;

type ResolveInterfaceable<
  I extends Interfaceable<unknown>
> = I extends ServiceProvider<infer T, unknown[]>
  ? T
  : I extends SingularServiceInterface<infer T>
  ? T
  : I extends MultiServiceInterface<infer T>
  ? T[]
  : I extends PolymorphicServiceInterface<infer T>
  ? Map<string, T>
  : never;

export type ResolveDependency<
  Dep extends ServiceDependency<any>
> = Dep extends typeof ServiceScope
  ? ServiceScope
  : Dep extends Interfaceable<unknown>
  ? ResolveInterfaceable<Dep>
  : Dep extends StrictServiceRequirement<infer I>
  ? ResolveInterfaceable<I>
  : Dep extends OptionalServiceRequirement<infer I>
  ? null | ResolveInterfaceable<I>
  : never;

export type ResolveDependencies<
  Deps extends readonly ServiceDependency<Interfaceable<unknown>>[]
> = {
  [Idx in keyof Deps]: ResolveDependency<Deps[Idx]>;
};

export type ServiceContainer<T, Args extends ReadonlyArray<unknown>> = {
  $$name: string;
  $$typeof: typeof MACHINAT_SERVICE_CONTAINER;
  $$deps: ServiceRequirement<Interfaceable<Args[number]>>[];
  $$factory(...args: Args): T;
  // HACK: make ts compiler accept it as class component
  new (): ServiceContainer<T, Args>;
};

export type MaybeContainer<T> = ServiceContainer<T, unknown[]> | T;

export type PolymorphicProviderBinding<T> = {
  provide: PolymorphicServiceInterface<T>;
  withProvider: ServiceProvider<T, unknown[]>;
  platform: string;
};

export type ProviderBinding<T> =
  | {
      provide:
        | SingularServiceInterface<T>
        | MultiServiceInterface<T>
        | ServiceProvider<T, unknown[]>;
      withProvider: ServiceProvider<T, unknown[]>;
    }
  | PolymorphicProviderBinding<T>;

export type PolymorphicValueBinding<T> = {
  provide: PolymorphicServiceInterface<T>;
  withValue: T;
  platform: string;
};

export type ValueBinding<T> =
  | {
      provide:
        | SingularServiceInterface<T>
        | MultiServiceInterface<T>
        | ServiceProvider<T, unknown[]>;
      withValue: T;
    }
  | PolymorphicValueBinding<T>;

export type ServiceBinding<T> = ProviderBinding<T> | ValueBinding<T>;

export type ServiceProvision<T> =
  | ServiceBinding<T>
  | ServiceProvider<T, unknown[]>;

export type ServiceCache = Map<ServiceProvider<unknown, unknown[]>, unknown>;
