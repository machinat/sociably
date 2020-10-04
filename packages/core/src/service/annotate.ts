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
}: ProvideOptions<_T>) => <T extends _T = _T>(
  klazz: Constructor<T>
): ServiceProvider<T> & Constructor<T> => {
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

type AnstractInterfaceOptions = {
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
export const abstractInterface = <_T>(options?: AnstractInterfaceOptions) => <
  T = _T
>(
  klazz: AbstractConstructor<T>
): ServiceInterface<T> & Constructor<T> => {
  return Object.defineProperties(klazz, {
    $$typeof: { value: MACHINAT_SERVICE_INTERFACE },
    $$name: { value: options?.name || klazz.name },
    $$multi: { value: false },
  });
};

type makeInterfaceOptions = {
  multi?: boolean;
  name: string;
};

/**
 * makeInterface make a non class service interface
 * @category Service Registry
 */
export const makeInterface = <T>({
  multi = false,
  name,
}: makeInterfaceOptions): ServiceInterface<T> => ({
  $$name: name,
  $$multi: multi,
  $$typeof: MACHINAT_SERVICE_INTERFACE,
});
