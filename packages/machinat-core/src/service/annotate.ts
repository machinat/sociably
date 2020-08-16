import invariant from 'invariant';
import {
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_INTERFACE,
} from '../symbol';
import type {
  ServiceLifetime,
  ServiceContainer,
  ServiceProvider,
  ServiceInterface,
  Interfaceable,
  ClassType,
  ServiceRequirement,
} from './types';
import { polishServiceRequirement } from './utils';

type InjectOptions = {
  name?: string;
  deps?: (ServiceRequirement<any> | Interfaceable<any> | ClassType<any>)[];
};

const validateLifetime = (lifetime: string) => {
  invariant(
    lifetime === 'singleton' ||
      lifetime === 'scoped' ||
      lifetime === 'transient',
    `${lifetime} is not valid service lifetime`
  );
};

/**
 * container marks a function as a container and annotate the dependencies
 */
export const container = <T>({ name, deps = [] }: InjectOptions = {}) => (
  fn: (...args: any[]) => T
): ServiceContainer<T> => {
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(fn, {
    $$typeof: { value: MACHINAT_SERVICES_CONTAINER },
    $$name: { value: name || fn.name },
    $$deps: { value: requirements },
  });
};

type ProvideOptions<T> = {
  name?: string;
  deps?: (ServiceRequirement<any> | Interfaceable<any> | ClassType<any>)[];
  factory?: (...args: any[]) => T;
  lifetime: ServiceLifetime;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor<T> = Function & {
  new (...args: any[]): T;
};

/**
 * provider annotate a class as a provider serving for the instance type and
 * also an interface can be implemented
 */
export const provider = <T>({
  name,
  deps = [],
  factory,
  lifetime,
}: ProvideOptions<T>) => (
  klazz: Constructor<T>
): Constructor<T> & ServiceProvider<T> => {
  validateLifetime(lifetime);
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(klazz, {
    $$name: { value: name || klazz.name },
    $$typeof: { value: MACHINAT_SERVICES_PROVIDER },
    $$deps: { value: requirements },
    $$factory: { value: factory || ((...args) => new klazz(...args)) }, // eslint-disable-line new-cap
    $$lifetime: { value: lifetime },
    $$multi: { value: false },
  });
};

type FactoryOptions = {
  name?: string;
  deps?: (ServiceRequirement<any> | Interfaceable<any> | ClassType<any>)[];
  lifetime: ServiceLifetime;
};

/**
 * factory annotate a factory function as a provider
 */
export const factory = <T>({ name, deps = [], lifetime }: FactoryOptions) => (
  factoryFn: (...args: any[]) => T
): ServiceProvider<T> => {
  validateLifetime(lifetime);
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(factoryFn, {
    $$name: { value: name || factoryFn.name },
    $$typeof: { value: MACHINAT_SERVICES_PROVIDER },
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
 * abstract annotate an abstract class as a servcie interface
 */
export const abstractInterface = <T>({
  name,
}: AnstractInterfaceOptions = {}) => (
  klazz: AbstractConstructor<T>
): Constructor<T> & Interfaceable<T> => {
  return Object.defineProperties(klazz, {
    $$typeof: { value: MACHINAT_SERVICES_INTERFACE },
    $$name: { value: name || klazz.name },
    $$multi: { value: false },
  });
};

type makeInterfaceOptions = {
  multi?: boolean;
  name: string;
};

/**
 * makeInterface make a non class service interface
 */
export const makeInterface = <T>({
  multi = false,
  name,
}: makeInterfaceOptions): ServiceInterface<T> => ({
  $$name: name,
  $$multi: multi,
  $$typeof: MACHINAT_SERVICES_INTERFACE,
});
