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
  ServiceDependency,
  ResolveDependencies,
} from './types';
import { polishServiceRequirement } from './utils';

/** @internal */
const validateLifetime = (lifetime: string) => {
  invariant(
    lifetime === 'singleton' ||
      lifetime === 'scoped' ||
      lifetime === 'transient',
    `${lifetime} is not valid service lifetime`
  );
};

type ServiceFactory<T, Deps extends readonly ServiceDependency<any>[]> = (
  ...args: ResolveDependencies<Deps>
) => T;

type ContainerOptions<Deps extends readonly ServiceDependency<any>[]> = {
  name?: string;
  deps?: Deps;
};

/**
 * makeContainer marks a function as a container and annotate the dependencies.
 * @category Service Registry
 */
export const makeContainer = <Deps extends readonly ServiceDependency<any>[]>({
  name,
  deps = [] as any,
}: ContainerOptions<Deps>) => <T>(
  fn: ServiceFactory<T, Deps>
): ServiceContainer<T, ResolveDependencies<Deps>> => {
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(fn, {
    $$typeof: { value: MACHINAT_SERVICE_CONTAINER },
    $$name: { value: name || fn.name },
    $$deps: { value: requirements },
  });
};

type ClassProviderOptions<T, Deps extends readonly ServiceDependency<any>[]> = {
  name?: string;
  deps?: Deps;
  factory?: ServiceFactory<T, Deps>;
  lifetime: ServiceLifetime;
};

type Constructor<T> = {
  new (...args: any[]): T;
};

/**
 * makeClassProvider annotate a class as a provider serving for the instance
 * type, and also an interface can be implemented.
 * @category Service Registry
 */
export const makeClassProvider = <
  _T,
  Deps extends readonly ServiceDependency<any>[]
>({
  name,
  deps = [] as any,
  factory,
  lifetime,
}: ClassProviderOptions<_T, Deps>) => <T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
): ServiceProvider<T, ResolveDependencies<Deps>> & Klazz => {
  validateLifetime(lifetime);
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(klazz, {
    $$name: { value: name || klazz.name, configurable: true },
    $$typeof: { value: MACHINAT_SERVICE_PROVIDER, configurable: true },
    $$deps: { value: requirements, configurable: true },
    $$factory: {
      value: factory || ((...args) => new klazz(...args)), // eslint-disable-line new-cap
      configurable: true,
    },
    $$lifetime: { value: lifetime, configurable: true },
    $$multi: { value: false, configurable: true },
  });
};

type FactoryProviderOptions<Deps extends readonly ServiceDependency<any>[]> = {
  name?: string;
  deps?: Deps;
  lifetime: ServiceLifetime;
};

/**
 * makeFactoryProvider annotate a factory function as a provider serving for the
 * instance type, and also an interface can be implemented.
 * @category Service Registry
 */
export const makeFactoryProvider = <
  Deps extends readonly ServiceDependency<any>[]
>({
  name,
  deps = [] as any,
  lifetime,
}: FactoryProviderOptions<Deps>) => <T>(
  factory: ServiceFactory<T, Deps>
): ServiceProvider<T, ResolveDependencies<Deps>> & ServiceFactory<T, Deps> => {
  validateLifetime(lifetime);
  const requirements = deps.map(polishServiceRequirement);

  return Object.defineProperties(factory, {
    $$name: { value: name || factory.name, configurable: true },
    $$typeof: { value: MACHINAT_SERVICE_PROVIDER, configurable: true },
    $$deps: { value: requirements, configurable: true },
    $$factory: { value: factory, configurable: true },
    $$lifetime: { value: lifetime, configurable: true },
    $$multi: { value: false, configurable: true },
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
    $$multi: multi as never,
    $$branched: branched,
    $$typeof: MACHINAT_SERVICE_INTERFACE,
  };
}
