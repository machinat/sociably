// @flow
import type { EventContext } from 'machinat-base/types';
import typeof {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_ABSTRACTION,
  MACHINAT_SERVICES_INTERFACEABLE,
} from './constant';
import type { AppInjector } from './injector';

export type ServeStrategy = 'singleton' | 'scoped' | 'lazy' | 'transient';

// eslint-disable-next-line no-use-before-define
export type ContainerFunc<Args, T> = (...args: Args[]) => T;

export type AbstractProvider<T> = Class<T> & {|
  $$typeof: MACHINAT_SERVICES_ABSTRACTION,
|};

export type NamedInterfaceable = {|
  $$typeof: MACHINAT_SERVICES_INTERFACEABLE,
  name: string,
|};

export type ServiceProvider<T> = {|
  name: string,
  $$typeof: MACHINAT_SERVICES_PROVIDER,
  $$strategy: ServeStrategy,
  $$deps: InjectRequirement[], // eslint-disable-line no-use-before-define
  $$factory: ContainerFunc<any, Promise<T>>,
|};

export type Interfaceable =
  | NamedInterfaceable
  | AbstractProvider<any>
  | ServiceProvider<any>;

export type InjectRequirement = {|
  require: Interfaceable,
  optional: boolean,
|};

export type ServiceContainer<T> = ContainerFunc<any, T> & {|
  $$typeof: MACHINAT_SERVICES_CONTAINER,
  $$deps: InjectRequirement[],
|};

type ProviderBinding = {|
  provide: Interfaceable,
  withService: ServiceProvider<any>,
  platforms?: string[],
|};

type ValueBinding = {|
  provide: Interfaceable,
  withValue: any,
  platforms?: string[],
|};

export type ProvisionBinding = ProviderBinding | ValueBinding;

export type ServiceModule = {|
  provisions: ProvisionBinding[],
  startHook: (
    injector: AppInjector,
    popEvent: (
      EventContext<any, any, any, any, any, any, any, any, any>
    ) => void,
    popError: (Error) => void
  ) => Promise<void>,
|};

export type ServiceCache<T> = Map<ServiceProvider<T>, T>;
