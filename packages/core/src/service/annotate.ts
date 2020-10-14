import invariant from 'invariant';
import {
  MACHINAT_SERVICE_PROVIDER,
  MACHINAT_SERVICE_CONTAINER,
  MACHINAT_SERVICE_INTERFACE,
} from '../symbol';
import type {
  ServiceLifetime,
  ServiceContainer,
  ServiceProvider,
  ServiceInterface,
  BranchedServiceInterface,
  MultiServiceInterface,
  SingularServiceInterface,
  Interfaceable,
  ServiceRequirement,
} from './types';
import { polishServiceRequirement } from './utils';

type InjectOptions = {
  name?: string;
  deps?: (ServiceRequirement<any> | Interfaceable<any>)[];
};

/** @internal */
const validateLifetime = (lifetime: string) => {
  invariant(
    lifetime === 'singleton' ||
      lifetime === 'scoped' ||
      lifetime === 'transient',
    `${lifetime} is not valid service lifetime`
  );
};

/**
 * container marks a function as a container and annotate the dependencies.
 * @category Service Registry
 */
export const container = <_T>({ name, deps = [] }: InjectOptions = {}) => <
  T = _T
>(
  fn: (...args: any[]) => T
): ServiceContainer<T> => {
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(fn, {
    $$typeof: { value: MACHINAT_SERVICE_CONTAINER },
    $$name: { value: name || fn.name },
    $$deps: { value: requirements },
  });
};

type ProvideOptions<T> = {
  name?: string;
  deps?: (ServiceRequirement<any> | Interfaceable<any>)[];
  factory?: (...args: any[]) => T;
  lifetime: ServiceLifetime;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor<T> = Function & {
  new (...args: any[]): T;
};

/**
 * provider annotate a class as a provider serving for the instance type and
 * also an interface can be implemented.
 * @category Service Registry
 */
export const provider = <_T>({
  name,
  deps = [],
  factory,
  lifetime,
}: ProvideOptions<_T>) => <
  T extends _T = _T,
  K extends Constructor<T> = Constructor<T>
>(
  klazz: K
): ServiceProvider<T> & K => {
  validateLifetime(lifetime);
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(klazz, {
    $$name: { value: name || klazz.name },
    $$typeof: { value: MACHINAT_SERVICE_PROVIDER },
    $$deps: { value: requirements },
    $$factory: { value: factory || ((...args) => new klazz(...args)) }, // eslint-disable-line new-cap
    $$lifetime: { value: lifetime },
    $$multi: { value: false },
  });
};

type FactoryOptions = {
  name?: string;
  deps?: (ServiceRequirement<any> | Interfaceable<any>)[];
  lifetime: ServiceLifetime;
};

/**
 * factory annotate a factory function as a provider.
 * @category Service Registry
 */
export const factory = <_T>({ name, deps = [], lifetime }: FactoryOptions) => <
  T = _T
>(
  factoryFn: (...args: any[]) => T
): ServiceProvider<T> => {
  validateLifetime(lifetime);
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(factoryFn, {
    $$name: { value: name || factoryFn.name },
    $$typeof: { value: MACHINAT_SERVICE_PROVIDER },
    $$deps: { value: requirements },
    $$factory: { value: factoryFn },
    $$lifetime: { value: lifetime },
  });
};

type AbstractInterfaceOptions = {
  name?: string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type AbstractConstructor<T> = Function & {
  prototype: T;
};

/**
 * abstract annotate an abstract class as a servcie interface.
 * @category Service Registry
 */
export const abstractInterface = <_T>(options?: AbstractInterfaceOptions) => <
  T = _T
>(
  klazz: AbstractConstructor<T>
): SingularServiceInterface<T> & Constructor<T> => {
  return Object.defineProperties(klazz, {
    $$typeof: { value: MACHINAT_SERVICE_INTERFACE },
    $$name: { value: options?.name || klazz.name },
    $$multi: { value: false },
  });
};

type MakeInterfaceOptions = {
  multi?: boolean;
  branched?: boolean;
  name: string;
};

/**
 * makeInterface make a non class service interface
 * @category Service Registry
 */
export function makeInterface<T>(options: {
  name: string;
  branched: true;
}): BranchedServiceInterface<T>;
export function makeInterface<T>(options: {
  name: string;
  multi: true;
}): MultiServiceInterface<T>;
export function makeInterface<T>(options: {
  name: string;
  multi?: false;
  branched?: false;
}): SingularServiceInterface<T>;
export function makeInterface<T>({
  multi = false,
  branched = false,
  name,
}: MakeInterfaceOptions): ServiceInterface<T> {
  invariant(
    !(multi && branched),
    'cannot be mulit and branched at the same time'
  );

  return {
    $$name: name,
    $$multi: multi as any,
    $$branched: branched,
    $$typeof: MACHINAT_SERVICE_INTERFACE,
  };
}
